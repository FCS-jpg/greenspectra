import os
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from routers import diagnose, history

app = FastAPI(title="GreenSpectra API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(diagnose.router)
app.include_router(history.router)

_DEMO_IMAGES_PATH = Path(os.environ.get("DEMO_MODE_IMAGES_PATH", "./demo_images"))
_ALLOWED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


@app.get("/demo-images/{filename}")
async def serve_demo_image(filename: str):
    """Serve demo image thumbnails for the frontend gallery."""
    safe_name = Path(filename).name
    if safe_name != filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    img_path = _DEMO_IMAGES_PATH / safe_name
    if img_path.suffix.lower() not in _ALLOWED_SUFFIXES or not img_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(img_path)


@app.on_event("startup")
async def preload_demo():
    """
    Run real inference on every image in demo_images/ and populate DEMO_CACHE.
    Prints each result so predictions can be verified on startup.
    """
    from PIL import Image
    from services.model_service import predict
    from services.heatmap_service import generate_heatmap
    from services.groq_service import get_treatment

    demo_path = Path(os.environ.get("DEMO_MODE_IMAGES_PATH", "./demo_images"))
    if not demo_path.exists():
        print(f"[demo] demo_images/ not found at {demo_path} — skipping preload")
        return

    image_files = sorted(demo_path.glob("*.jpg")) + sorted(demo_path.glob("*.jpeg")) + \
                  sorted(demo_path.glob("*.png"))

    if not image_files:
        print("[demo] No images found in demo_images/ — skipping preload")
        return

    print(f"\n[demo] Running inference on {len(image_files)} demo image(s)…")

    for img_path in image_files:
        stem = img_path.stem
        try:
            image      = Image.open(img_path).convert("RGB")
            prediction = predict(image)
            heatmap    = generate_heatmap(image, prediction["disease"])
            treatment  = await get_treatment(prediction["disease"], prediction["confidence"], prediction["all_probs"])

            diagnose.DEMO_CACHE[stem] = {
                "disease":    prediction["disease"],
                "confidence": prediction["confidence"],
                "all_probs":  prediction["all_probs"],
                "heatmap":    heatmap,
                "treatment":  treatment,
            }

            bar = "█" * int(prediction["confidence"] * 20)
            print(
                f"  {stem:<20} → {prediction['disease']:<18} "
                f"{prediction['confidence']*100:5.1f}%  {bar}"
            )
        except Exception as e:
            print(f"  {stem:<20} → ERROR: {e}")

    print(f"[demo] Cache ready: {sorted(diagnose.DEMO_CACHE)}\n")


@app.get("/health")
async def health():
    return {"status": "ok", "demo_cache": sorted(diagnose.DEMO_CACHE)}
