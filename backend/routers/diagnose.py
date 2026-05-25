import base64
import io
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image

from middleware.auth import get_current_user, supabase
from services.groq_service import get_treatment
from services.heatmap_service import generate_heatmap
from services.model_service import predict

router = APIRouter(prefix="/api", tags=["diagnose"])

DEMO_CACHE: dict = {}

_BUCKET = "crop-images"


# ── Storage helpers ────────────────────────────────────────────────────────────

def _upload_bytes(data: bytes, content_type: str, extension: str) -> str | None:
    if supabase is None:
        return None
    path = f"{uuid.uuid4()}.{extension}"
    try:
        supabase.storage.from_(_BUCKET).upload(
            path, data, {"content-type": content_type, "upsert": "true"}
        )
        return supabase.storage.from_(_BUCKET).get_public_url(path)
    except Exception as e:
        print(f"[storage] Upload failed ({path}): {e}")
        return None


def _image_bytes(image: Image.Image) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def _heatmap_bytes(heatmap_b64: str) -> bytes:
    return base64.b64decode(heatmap_b64)


# ── Persistence ────────────────────────────────────────────────────────────────

async def _save_diagnosis(
    user_id: str,
    prediction: dict,
    treatment: dict,
    image: Image.Image,
    heatmap_b64: str,
) -> None:
    if supabase is None:
        return
    try:
        image_url = _upload_bytes(_image_bytes(image), "image/jpeg", "jpg")
        heatmap_url = _upload_bytes(_heatmap_bytes(heatmap_b64), "image/png", "png")

        supabase.table("diagnosis_history").insert({
            "user_id":     user_id,
            "disease":     prediction["disease"],
            "confidence":  prediction["confidence"],
            "treatment":   treatment,
            "image_url":   image_url,
            "heatmap_url": heatmap_url,
        }).execute()
    except Exception as e:
        print(f"[save_diagnosis] Failed: {e}")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/diagnose")
async def diagnose_crop(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Please upload a valid image file (JPG, PNG, or WebP)")

    prediction  = predict(image)
    heatmap_b64 = generate_heatmap(image, prediction["disease"])
    treatment   = await get_treatment(prediction["disease"], prediction["confidence"], prediction["all_probs"])

    await _save_diagnosis(
        current_user.get("sub", "guest-user"),
        prediction,
        treatment,
        image,
        heatmap_b64,
    )

    return JSONResponse({
        "disease":    prediction["disease"],
        "confidence": prediction["confidence"],
        "all_probs":  prediction["all_probs"],
        "heatmap":    heatmap_b64,
        "treatment":  treatment,
        "timestamp":  datetime.utcnow().isoformat(),
    })


@router.get("/demo/{image_name}")
async def get_demo_diagnosis(image_name: str):
    if not DEMO_CACHE:
        raise HTTPException(503, "Demo cache is still loading — retry in a moment")
    entry = DEMO_CACHE.get(image_name)
    if entry is None:
        raise HTTPException(404, f"Demo '{image_name}' not found. Available: {sorted(DEMO_CACHE)}")
    return entry
