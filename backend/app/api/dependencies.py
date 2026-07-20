from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()

def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    user = None
    
    if token in ("demo_mode_token", "local-demo-token"):
        user = {"id": "demo-user-uuid", "email": "demo@mymentor.app"}
    else:
        try:
            # Decode Supabase JWT
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
            user_id = payload.get("sub")
            email = payload.get("email")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload: missing sub claim"
                )
            user = {"id": user_id, "email": email}
        except JWTError as e:
            # Fallback for local development if using the default secret
            if settings.JWT_SECRET == "supersecretjwtkeyforlocaldevelopmentonlychangeinprod":
                user = {"id": "local-dev-user-uuid", "email": "dev@mymentor.app"}
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Could not validate credentials: {str(e)}"
                )

    # Enforce read-only constraint for demo account on database writes ONLY in production (PostgreSQL)
    if "sqlite" not in settings.DATABASE_URL.lower():
        if request.method in ("POST", "PUT", "DELETE", "PATCH") and user.get("email") == "demo@mymentor.app":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Demo account is read-only in production. Database modifications are disabled."
            )

    return user
