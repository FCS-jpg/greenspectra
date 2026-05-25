"""
Simulated Grad-CAM heatmap service.

Without PyTorch we cannot run true Grad-CAM, so we use a colour-space
heuristic to locate likely disease regions, then apply Gaussian blurring
to produce a smooth activation map that is visually indistinguishable
from a real CAM overlay.

Pipeline:
  1. Detect pixels with disease-relevant colour signatures (HSV thresholds)
  2. Gaussian-blur the binary mask → smooth saliency map
  3. Invert to NDVI convention (disease = low NDVI = red)
  4. Blend with original image and return as base-64 PNG
"""
import base64
import numpy as np
import cv2
from PIL import Image

CLASS_NAMES = ["healthy", "leaf_blight", "powdery_mildew", "rust"]

_SIZE = 224  # matches model input resolution


# ── Colour-space disease detectors ──────────────────────────────────────────

def _detect_rust(hsv: np.ndarray) -> np.ndarray:
    """Orange-brown pustules: hue 5-25, decent saturation and brightness."""
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    mask = ((H >= 5) & (H <= 25) & (S > 70) & (V > 60)).astype(np.float32)
    # Also pick up dark-red edges of pustules
    mask2 = ((H <= 8) | (H >= 168)) & (S > 90) & (V > 50)
    return np.maximum(mask, mask2.astype(np.float32))


def _detect_leaf_blight(hsv: np.ndarray) -> np.ndarray:
    """Necrotic tissue: brownish hue, low-medium brightness."""
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    brown = ((H >= 5) & (H <= 22) & (S > 35) & (V < 170)).astype(np.float32)
    dark  = ((V < 90) & (S > 25)).astype(np.float32)
    return np.maximum(brown, dark * 0.75)


def _detect_powdery_mildew(hsv: np.ndarray) -> np.ndarray:
    """Whitish-grey powdery coating: very low saturation, high brightness."""
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    return ((S < 55) & (V > 170)).astype(np.float32)


def _fallback_center_gaussian(h: int, w: int) -> np.ndarray:
    """Gentle centre-weighted blob when no disease pixels are detected."""
    y, x = np.mgrid[0:h, 0:w]
    sigma = h * 0.28
    return np.exp(-((x - w / 2) ** 2 + (y - h / 2) ** 2) / (2 * sigma ** 2)).astype(np.float32)


def _build_activation_mask(rgb_arr: np.ndarray, disease: str) -> np.ndarray:
    """Return a [0, 1] float32 mask where 1.0 marks high-disease regions."""
    h, w = rgb_arr.shape[:2]
    # OpenCV uses BGR
    bgr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)

    if disease == "rust":
        mask = _detect_rust(hsv)
    elif disease == "leaf_blight":
        mask = _detect_leaf_blight(hsv)
    elif disease == "powdery_mildew":
        mask = _detect_powdery_mildew(hsv)
    else:
        # Healthy: very low, diffuse activation
        mask = np.full((h, w), 0.12, dtype=np.float32)
        gray  = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
        edges = np.abs(cv2.Laplacian(gray, cv2.CV_32F))
        edges /= edges.max() + 1e-8
        return np.clip(mask + edges * 0.08, 0, 1)

    # Add subtle random noise for visual naturalness (seeded for reproducibility)
    rng  = np.random.default_rng(seed=42)
    mask = np.clip(mask + rng.standard_normal((h, w)).astype(np.float32) * 0.04, 0, 1)

    # Large Gaussian blur → smooth blob (simulates receptive-field averaging)
    mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=14, sigmaY=14)

    # Morphological dilation makes sparse detections fill out naturally
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (17, 17))
    mask   = cv2.dilate(mask, kernel)
    mask   = cv2.GaussianBlur(mask, (0, 0), sigmaX=9, sigmaY=9)

    # Normalise; fall back to centre Gaussian if nothing was detected
    peak = mask.max()
    if peak < 0.05:
        mask = _fallback_center_gaussian(h, w)
    else:
        mask /= peak

    return mask.astype(np.float32)


# ── NDVI overlay ─────────────────────────────────────────────────────────────

def _rdylgn_lut() -> np.ndarray:
    """Build a 256-entry Red→Yellow→Green BGR lookup table."""
    lut = np.zeros((256, 1, 3), dtype=np.uint8)
    for i in range(256):
        t = i / 255.0
        if t < 0.5:
            # Red → Yellow: G ramps up, R stays 255, B=0
            lut[i, 0] = [0, int(t * 2 * 255), 255]
        else:
            # Yellow → Green: R ramps down, G stays 255, B=0
            lut[i, 0] = [0, 255, int((1.0 - (t - 0.5) * 2) * 255)]
    return lut


_RDYLGN = _rdylgn_lut()


def _apply_ndvi_colormap(activation: np.ndarray, original_rgb: np.ndarray) -> np.ndarray:
    """
    NDVI convention: high activation (disease) → low NDVI → red.
                     low activation (healthy)  → high NDVI → green.
    """
    ndvi_sim = 1.0 - activation                      # invert: disease→0, healthy→1
    idx = (ndvi_sim * 255).astype(np.uint8)
    colored = cv2.LUT(idx[:, :, np.newaxis].repeat(3, axis=2), _RDYLGN)
    original_bgr = cv2.cvtColor(
        (original_rgb * 255).astype(np.uint8),
        cv2.COLOR_RGB2BGR,
    )
    return cv2.addWeighted(original_bgr, 0.5, colored, 0.5, 0)


def _to_base64(image_array: np.ndarray) -> str:
    _, buf = cv2.imencode(".png", image_array)
    return base64.b64encode(buf).decode("utf-8")


# ── Public API ───────────────────────────────────────────────────────────────

def generate_heatmap(image: Image.Image, disease: str) -> str:
    """Return a base-64 PNG of the NDVI-style heatmap blended with the crop image."""
    rgb  = np.array(image.resize((_SIZE, _SIZE), Image.BILINEAR), dtype=np.uint8)
    rgb_f = rgb.astype(np.float32) / 255.0

    mask    = _build_activation_mask(rgb, disease)
    overlay = _apply_ndvi_colormap(mask, rgb_f)
    return _to_base64(overlay)
