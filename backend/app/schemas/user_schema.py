from typing import Optional
from datetime import datetime
import uuid

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: str
    role: str = "viewer"


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    user_id: uuid.UUID
    full_name: Optional[str]
    email: Optional[str]
    role: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
