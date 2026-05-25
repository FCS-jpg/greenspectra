#!/usr/bin/env python3
"""
Pre-generate demo cache so API startup is instant.

Run once (or again after adding new demo images):
    cd backend && python generate_demo_cache.py

Reads from:  demo_images/*.jpg
Writes to:   demo_cache/<stem>.json

Each JSON file contains the full diagnosis response payload:
  disease, confidence, all_probs, heatmap (base64 PNG), treatment
"""
import asyncio
import json
import sys
import time
from pathlib import Path

# Must be run from the backend/ directory so relative imports work
from dotenv import load_dotenv
load_dotenv()

from PIL import Image

DEMO_DIR  = Path("demo_images")
CACHE_DIR = Path("demo_cache")


def check_env():
    import os
    missing = [v for v in ("MODEL_PATH", "GROQ_API_KEY") if not os.environ.get(v)]
    if missing:
        print(f"[warn] Missing env vars: {', '.join(missing)}")
        print("       Set them in backend/.env before running.")


async def process_one(img_path: Path) -> dict:
    from services.model_service import predict
    from services.heatmap_service import generate_heatmap
    from services.groq_service import get_treatment

    image = Image.open(img_path).convert("RGB")
    prediction = predict(image)
    heatmap    = generate_heatmap(image, prediction["disease"])
    treatment  = await get_treatment(prediction["disease"], prediction["confidence"])

    return {
        "disease":    prediction["disease"],
        "confidence": prediction["confidence"],
        "all_probs":  prediction["all_probs"],
        "heatmap":    heatmap,
        "treatment":  treatment,
    }


async def main():
    check_env()
    CACHE_DIR.mkdir(exist_ok=True)

    images = sorted(DEMO_DIR.glob("*.jpg")) + sorted(DEMO_DIR.glob("*.jpeg"))
    if not images:
        print(f"No images found in {DEMO_DIR}/")
        sys.exit(1)

    print(f"Found {len(images)} image(s) in {DEMO_DIR}/\n")
    success = 0

    for img_path in images:
        name       = img_path.stem
        cache_file = CACHE_DIR / f"{name}.json"
        print(f"  [{name}]  ", end="", flush=True)
        t0 = time.perf_counter()
        try:
            payload = await process_one(img_path)
            cache_file.write_text(json.dumps(payload, ensure_ascii=False))
            elapsed = time.perf_counter() - t0
            print(f"✓  {payload['disease']}  conf={payload['confidence']:.1%}  ({elapsed:.1f}s)")
            success += 1
        except Exception as e:
            print(f"✗  {e}")

    print(f"\n{success}/{len(images)} cached → {CACHE_DIR}/")
    if success < len(images):
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
