import torch
import torch.nn as nn
from LoadingModel import model
from transformers import get_scheduler
from my_tokenize import load_tokenizer, encode_text
from preprocess import my_split
from torch import optim
from torch.utils.data import DataLoader
import csv

device = "cpu"
num_epochs = 3
learning_rate = 5e-5
batch_size = 8

style_to_id = {
    "scandinavian": 0,
    "classic": 1,
    "modern": 2,
    "rustic": 3,
    "industrial": 4,
    "boho_chic": 5,
}

tokenizer = load_tokenizer("disilbert")

encoded_dataset = []
csv_path = "design_style_dataset_500.csv"
with open(csv_path, mode="r", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        # Free-text answer and its design style label
        original_text = row["answer"]
        label_str = row["design_style"]
        clean_label = label_str.strip().lower()
        if clean_label not in style_to_id:
            continue
        # Clean the text and tokenize it
        cleaned_text = my_split(original_text)
        encoded = encode_text(tokenizer, cleaned_text)
        encoded["labels"] = style_to_id[label_str]
        encoded_dataset.append(encoded)
train_dataloader = DataLoader(encoded_dataset, batch_size=batch_size, shuffle=True)


model.to(device)
optimizer = optim.AdamW(model.parameters(), lr=learning_rate)
num_training_steps = num_epochs * len(train_dataloader)
lr_scheduler = get_scheduler(
    "linear",
    optimizer=optimizer,
    num_warmup_steps=0,
    num_training_steps=num_training_steps,
)
criterion = nn.CrossEntropyLoss()
model.train()
for epoch in range(num_epochs):
    print(f"\n--- Starting Epoch {epoch+1}/{num_epochs} ---")
    total_loss = 0
    # Training loop
    for batch in train_dataloader:
        input_ids = batch["input_ids"].to(device)
        labels = batch["labels"].to(device).long()
        logits = model(input_ids)
        if len(logits.shape) == 3:
            logits = logits[:, 0, :]
        loss = criterion(logits, labels)

        loss.backward()
        optimizer.step()
        lr_scheduler.step()
        optimizer.zero_grad()

print("\nTraining finished! Saving model weights...")
torch.save(model.state_dict(), "design_model_weights.pt")
print("Model weights saved successfully as 'design_model_weights.pt'!")
print("Model saved to folder: ./my_design_model")


# Test the trained model on a few example sentences
def test_model(model, tokenizer, texts, device="cpu"):
    print("\n--- Running Test Predictions ---")
    model.to(device)
    model.eval()
    for text in texts:
        encoded = encode_text(tokenizer, text)
        input_ids = tokenizer(
            text, return_tensors="pt", truncation=True, padding=True, max_length=128
        ).to(device)
        with torch.no_grad():
            logits = model(**input_ids)
            if len(logits.shape) == 3:
                logits = logits[:, 0, :]
        predictions = torch.argmax(logits, dim=-1)
        print(f"Text: {text}")
        print(f"Logits: {logits.cpu().numpy()}")
        print(f"Predicted tag index: {predictions.item()}")


test_texts = [
    "I want a Scandinavian style room with a double bed",
    "Small office room with a large desk",
]

test_model(model, tokenizer, test_texts, device="cpu")
try:
    output_dir = "./my_final_model"

    model.save_pretrained(output_dir)

    tokenizer.save_pretrained(output_dir)

    print(f"SUCCESS! The model and tokenizer are saved in {output_dir}")
except Exception as e:
    print(f"Failed: {e}")