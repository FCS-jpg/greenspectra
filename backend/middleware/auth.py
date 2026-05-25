import os
from fastapi import Header, HTTPException

_GUEST = {"sub": "guest-user", "email": "guest@demo.com"}

# Supabase client is optional — missing env vars degrade gracefully to guest mode
supabase = None
try:
    from supabase import create_client
    _url = os.environ.get("SUPABASE_URL", "")
    _key = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if _url and _key:
        supabase = create_client(_url, _key)
except Exception as e:
    print(f"[auth] Supabase client unavailable: {e}")


async def get_current_user(authorization: str = Header(None)):
    # No token → guest access (allows demo/dev use without login)
    if not authorization or not authorization.startswith("Bearer "):
        return _GUEST

    token = authorization.split(" ")[1]

    if supabase is None:
        # Can't verify without a client — fall through to guest
        return _GUEST

    try:
        response = supabase.auth.get_user(token)
        user = response.user
        if user is None:
            raise HTTPException(401, "Invalid token")
        return {"sub": user.id, "email": user.email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(401, f"Token verification failed: {e}")
