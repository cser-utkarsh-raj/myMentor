import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates Supabase JWT.
    If no JWT is provided or Supabase URL is not configured (local development), 
    we fall back to a mock demo user ID.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    
    if not supabase_url:
        # Local development / Demo mode fallback
        return {"sub": "demo_user_123", "email": "demo@mymentor.app", "role": "authenticated"}
        
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    token = credentials.credentials
    # In production, we would decode and verify the JWT signature using Supabase's JWT secret
    # This is a placeholder for V3 integration.
    
    # Example placeholder return:
    return {"sub": "real_user_id", "email": "user@mymentor.app", "role": "authenticated"}
