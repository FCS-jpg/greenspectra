from fastapi import APIRouter, Depends
from middleware.auth import get_current_user, supabase

router = APIRouter(prefix="/api", tags=["history"])


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    if supabase is None:
        return []
    user_id = current_user["sub"]
    try:
        result = (
            supabase.table("diagnosis_history")
            .select("id, disease, confidence, treatment, image_url, heatmap_url, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return result.data
    except Exception as e:
        print(f"[history] Supabase query failed: {e}")
        return []
