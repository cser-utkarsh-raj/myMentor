from typing import Optional
import json
import urllib.request
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.core.logger import logger

security = HTTPBearer(auto_error=False)
_JWKS_CACHE: dict[str, object] = {}


def _supabase_jwks(issuer: str):
    if issuer in _JWKS_CACHE: return _JWKS_CACHE[issuer]
    if not issuer.startswith("https://"): raise ValueError("Invalid token issuer")
    host = issuer.split("/", 3)[2].lower()
    if not (host.endswith(".supabase.co") or host == "supabase.co"): raise ValueError("Untrusted token issuer")
    with urllib.request.urlopen(f"{issuer.rstrip('/')}/.well-known/jwks.json", timeout=3) as response:
        data = json.loads(response.read().decode("utf-8"))
    _JWKS_CACHE[issuer] = data.get("keys", [])
    return _JWKS_CACHE[issuer]


def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    token = credentials.credentials if credentials else None
    # Explicit demo tokens are intentionally public demo identities, not a fallback for invalid credentials.
    if token in ("demo_mode_token", "local-demo-token"):
        return {"id": "demo-user-uuid", "email": "demo@mymentor.app"}
    if not token or token in ("null", "undefined"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    for secret in [settings.SUPABASE_JWT_SECRET, settings.JWT_SECRET]:
        if not secret: continue
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
            user_id = payload.get("sub") or payload.get("user_id")
            if user_id: return {"id": str(user_id), "email": str(payload.get("email") or "user@mymentor.app")}
        except JWTError: pass

    try:
        claims = jwt.get_unverified_claims(token)
        issuer = str(claims.get("iss") or "")
        user_id = claims.get("sub") or claims.get("user_id")
        if issuer and user_id:
            keys = _supabase_jwks(issuer)
            header = jwt.get_unverified_header(token); kid = header.get("kid"); alg = header.get("alg") or "RS256"
            key = next((k for k in keys if not kid or k.get("kid") == kid), None)
            if key:
                payload = jwt.decode(token, key, algorithms=[alg], issuer=issuer, options={"verify_aud": False})
                return {"id": str(payload.get("sub") or user_id), "email": str(payload.get("email") or "user@mymentor.app")}
    except Exception as e:
        logger.warning(f"Supabase token verification failed: {e}")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token")
