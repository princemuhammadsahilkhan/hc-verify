import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.utils.jwt_handler import (
    SECRET_KEY as VOTER_JWT_SECRET,
    ALGORITHM as VOTER_JWT_ALGORITHM,
)

security = HTTPBearer(auto_error=False)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "Admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin")
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "hcverify-admin-secret")
ADMIN_TOKEN_ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRES_HOURS = 8

def create_admin_token(sub, role_name, level, permissions=None, is_env_bypass=False):
    payload = {
        "sub": sub,
        "role_name": role_name,
        "level": level,
        "permissions": permissions or [],
        "is_env_bypass": is_env_bypass,
        "exp": datetime.utcnow() + timedelta(hours=12)
    }
    return jwt.encode(payload, ADMIN_JWT_SECRET, algorithm=ADMIN_TOKEN_ALGORITHM)

async def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin credentials not configured"
        )
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            ADMIN_JWT_SECRET,
            algorithms=[ADMIN_TOKEN_ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    role = payload.get("role_name") or payload.get("role")
    level = payload.get("level")
    
    # Check against database for DB users
    if not payload.get("is_env_bypass"):
        from app.models import User, Role
        sub_val = str(payload.get("sub") or "")
        res = await db.execute(select(User).where((User.username.ilike(sub_val)) | (User.email.ilike(sub_val))))
        user = res.scalars().first()
        if user:
            role_res = await db.execute(select(Role).where(Role.role_id == user.role_id))
            role_obj = role_res.scalars().first()
            if role_obj:
                payload["level"] = role_obj.level or 100
                payload["role_name"] = role_obj.role_name
            else:
                payload["level"] = payload.get("level") or 100
        else:
            payload["level"] = payload.get("level") or 100
    
    return payload

def get_current_voter(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            VOTER_JWT_SECRET,
            algorithms=[VOTER_JWT_ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    if payload.get("role") != "voter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    return payload
