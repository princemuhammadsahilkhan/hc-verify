from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

def hash_password(password: str):

    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )


import bcrypt

def hash_password_bcrypt(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password_bcrypt(plain_password: str, hashed_password: str) -> bool:
    # Handles potential string encoding and compatibility checks
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta

security = HTTPBearer(auto_error=False)

ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "hcverify-admin-secret")
ADMIN_TOKEN_ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRES_HOURS = 8


def require_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
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

    return payload


def enforce_role(admin_user: dict, allowed_roles: list):
    if admin_user.get("role_name") not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied for this role"
        )