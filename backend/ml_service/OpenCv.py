import cv2
import numpy as np
import matplotlib.image as img
from PIL import Image
from sklearn.cluster import KMeans

# Classification thresholds
brightness_map = [(85, "Dark"), (170, "Medium"), (float("inf"), "Bright")]

lighting_map = [(25, "Uniform"), (60, "Moderate"), (float("inf"), "Uneven")]


def categorize(value, rules):
    for threshold, label in rules:
        if value < threshold:
            return label


def analyze_image_lighting_and_colors(pil_image: Image.Image) -> dict:
    img_np = np.array(pil_image)
    bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    brightness = float(np.mean(gray))
    std = float(np.std(gray))  # Standard deviation of pixel values — used as a proxy for lighting evenness

    img_small = np.array(pil_image.resize((150, 150)))  # Downscale for performance
    pixels = img_small.reshape(-1, 3)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)  # Cluster pixels into 3 dominant colors
    kmeans.fit(pixels)

    colors = []
    for center in kmeans.cluster_centers_:
        r, g, b = [int(c) for c in center]
        colors.append({"rgb": [r, g, b], "hex": f"#{r:02x}{g:02x}{b:02x}"})

    return {
        "brightness_value": round(brightness, 2),
        "brightness_category": categorize(brightness, brightness_map),
        "std_value": round(std, 2),
        "lighting_type": categorize(std, lighting_map),
        "colors": colors,
    }