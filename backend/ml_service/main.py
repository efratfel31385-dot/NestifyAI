from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
from PIL import Image
import io
import torch

import json
import torchvision
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.transforms import ToTensor
from transformers import (
    BlipProcessor,
    BlipForQuestionAnswering,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
)
import cv2
import numpy as np


from LoadingModel import model
from my_tokenize import load_tokenizer, encode_text
from preprocess import my_split
from OpenCv import analyze_image_lighting_and_colors
from concurrent.futures import ThreadPoolExecutor

with open("config.json", "r", encoding="utf-8") as f:
    config = json.load(f)

id_to_style = {int(k): v for k, v in config["id_to_style"].items()}
CLASS_NAMES = {int(k): v for k, v in config["CLASS_NAMES"].items()}
BLIP_QUESTIONS = config["BLIP_QUESTIONS"]
THRESHOLD = config["THRESHOLD"]
WEIGHTS_PATH = config["WEIGHTS_PATH"]

app = FastAPI()


device = torch.device("cpu")

# Loading the models
print("Loading text model...")
model.load_state_dict(
    torch.load("best_model_weights.pt", map_location=torch.device("cpu"))
)
model.eval()
tokenizer = load_tokenizer("disilbert")

print("Loading Faster R-CNN...")
rcnn_model = fasterrcnn_resnet50_fpn(weights=None, num_classes=24)
torch_dtype = torch.float16
rcnn_model.load_state_dict(torch.load(WEIGHTS_PATH, map_location=device))
rcnn_model.eval()

print("Loading BLIP...")
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-vqa-base")
blip_model = BlipForQuestionAnswering.from_pretrained("Salesforce/blip-vqa-base")
torch_dtype = torch.float16
blip_model.eval()


def ask_single(args):
    question, key = args
    inputs = blip_processor(
        images=ask_blip.current_image, text=question, return_tensors="pt"
    )
    outputs = blip_model.generate(**inputs)
    answer = blip_processor.decode(outputs[0], skip_special_tokens=True)
    return key, answer


# Sends the cropped image to BLIP to answer questions about it
def ask_blip(crop_image):
    ask_blip.current_image = crop_image
    question_keys = ["color", "material", "pattern", "shape"]
    # Run in parallel using threads
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(ask_single, zip(BLIP_QUESTIONS, question_keys)))
    return dict(results)


@app.post("/predict")
async def predict(
    file: UploadFile = File(...), style: str = Form(...), description: str = Form(...)
):
    try:
        # Run the text analysis pipeline
        cleaned_text = my_split(description)
        encoded = encode_text(tokenizer, cleaned_text)
        input_ids = encoded["input_ids"]

        with torch.no_grad():
            logits = model(input_ids)
            if len(logits.shape) == 3:
                logits = logits[:, 0, :]
                # Get the highest-scoring prediction
            prediction = torch.argmax(logits, dim=-1).item()
            # Map the predicted class index to its style name
        predicted_style_name = id_to_style.get(prediction, "unknown")
        # Read the image and prepare it for the model
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_analysis = analyze_image_lighting_and_colors(image)
        img_tensor = ToTensor()(image).unsqueeze(0).to(device)
        width, height = image.size
        image_total_pixels = width * height

        with torch.no_grad():
            predictions = rcnn_model(img_tensor)[0]
        # Extract furniture bounding boxes, confidence scores, and labels
        boxes = predictions["boxes"].cpu()
        scores = predictions["scores"].cpu()
        labels = predictions["labels"].cpu()
        detected_objects = []

        detected_count = 0
        MAX_OBJECTS = 15
        for box, score, label in zip(boxes, scores, labels):
            if score < THRESHOLD or detected_count >= MAX_OBJECTS:
                continue
            detected_count += 1

            # Compute the furniture's area and crop it from the image
            x1, y1, x2, y2 = box.tolist()
            area = (x2 - x1) * (y2 - y1)
            crop = image.crop((x1, y1, x2, y2))

            label_name = CLASS_NAMES.get(label.item(), "unknown")
            print(f"Analyzing {label_name}...")
            blip_answers = ask_blip(crop)
            detected_objects.append(
                {
                    "label": CLASS_NAMES.get(label.item(), "unknown"),
                    "confidence": round(float(score), 3),
                    "area": round(area, 1),
                    "color": blip_answers["color"],
                    "material": blip_answers["material"],
                    "pattern": blip_answers["pattern"],
                    "shape": blip_answers["shape"],
                }
            )
        # Return the full response
        return {
            "status": "success",
            "image_total_pixels": image_total_pixels,
            "image_analysis": image_analysis,
            "textEngineOutput": {
                "prediction": prediction,
                "predictedStyle": predicted_style_name,
                "logits": logits.tolist()[0],
            },
            "detected_objects": detected_objects,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# Different sentence templates for variety


@app.post("/generate_text")
async def generate_text(data: dict):
    try:
        style = data.get("style", "")
        furniture_list = data.get("furniture_list", [])
        reason = data.get("reason", "")

        if not furniture_list:
            if reason == "budget_too_low":
                result = (
                    f"💡 DIY Tips for {style} style:\n\n"
                    f"Your budget doesn't cover replacements right now — but here's what you can do:\n\n"
                    f"• 🎨 Paint furniture in colors matching the {style} aesthetic.\n"
                    f"• 🪑 Reupholster chairs and sofas with fitting fabric.\n"
                    f"• 🌿 Add plants, cushions, or rugs to elevate the look.\n"
                    f"• 🔧 Sand and re-stain wooden pieces for a fresh finish.\n\n"
                    f"Small changes make a big difference!"
                )
            else:
                result = (
                    f"✨ Great news!\n\n"
                    f"Your room already fits the {style} style beautifully. "
                    f"No furniture replacements needed!"
                )
            return {"status": "success", "generated_text": result}

        if (
            not furniture_list[0].get("old_color")
            or furniture_list[0].get("old_color") == "Unknown"
        ):
            result = f"Design recommendations for a room in the style {style}. You should buy the following items:\n"
            for item in furniture_list:
                result += (
                    f"Buy the product {item.get('new_name', '')} "
                    f"priced at {item.get('price', '')} $\n"
                )
        else:
            sentence_templates = [
                lambda item: (
                    f"• Consider replacing your {item['FurnitureType']} "
                    f"(currently {item['old_color']} {item['old_material']}) "
                    f"with a new {item['new_name']} for {item['price']} $ — "
                    f"it will perfectly complement the {style} aesthetic."
                ),
                lambda item: (
                    f"• Your {item['FurnitureType']} in {item['old_color']} {item['old_material']} "
                    f"doesn't quite fit the {style} style. "
                    f"A {item['new_name']} at {item['price']} $ would be a great upgrade."
                ),
                lambda item: (
                    f"• To enhance the {style} feel of your room, "
                    f"swap your {item['old_color']} {item['FurnitureType']} "
                    f"for a {item['new_name']} — available for {item['price']} $."
                ),
                lambda item: (
                    f"• The {item['FurnitureType']} is a key piece to update. "
                    f"Replace the current {item['old_color']} {item['old_material']} one "
                    f"with a {item['new_name']} ({item['price']}$) "
                    f"for a true {style} transformation."
                ),
                lambda item: (
                    f"• A fresh {item['new_name']} ({item['price']}$) will replace "
                    f"your existing {item['old_color']} {item['FurnitureType']}, "
                    f"bringing it in line with the {style} vision."
                ),
            ]

            lines = []
            for i, item in enumerate(furniture_list):
                template = sentence_templates[i % len(sentence_templates)]
                lines.append(template(item))

            result = f"Design recommendations for {style} style:\n\n" + "\n\n".join(
                lines
            )

        return {"status": "success", "generated_text": result}

    except Exception as e:
        return {"status": "error", "message": str(e)}