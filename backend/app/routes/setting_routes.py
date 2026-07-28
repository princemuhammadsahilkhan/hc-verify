import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import SystemSetting
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin/settings", tags=["Admin Settings"])


class SystemSettingCreate(BaseModel):
    setting_key: str
    setting_value: str
    description: Optional[str] = None


class SystemSettingResponse(BaseModel):
    setting_id: uuid.UUID
    setting_key: str
    setting_value: str
    description: Optional[str] = None
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[SystemSettingResponse])
async def get_all_settings(db: AsyncSession = Depends(get_db)):
    """Return all system settings from the database."""
    result = await db.execute(select(SystemSetting).order_by(SystemSetting.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=SystemSettingResponse, status_code=201)
async def create_setting(payload: SystemSettingCreate, db: AsyncSession = Depends(get_db)):
    """Create a new system setting."""
    existing = await db.execute(
        select(SystemSetting).where(SystemSetting.setting_key == payload.setting_key)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Setting with this key already exists.")

    new_setting = SystemSetting(
        setting_key=payload.setting_key,
        setting_value=payload.setting_value,
        description=payload.description
    )
    db.add(new_setting)
    await db.commit()
    await db.refresh(new_setting)
    return new_setting


class SystemSettingUpdate(BaseModel):
    setting_value: str
    description: Optional[str] = None


@router.put("/{setting_id}", response_model=SystemSettingResponse)
async def update_setting(setting_id: str, payload: SystemSettingUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing system setting."""
    result = await db.execute(select(SystemSetting).where(SystemSetting.setting_key == str(setting_id)))
    setting = result.scalars().first()
    if not setting:
        try:
            val_int = uuid.UUID(str(setting_id)).int & 0xFFFFFFFF
            result = await db.execute(select(SystemSetting).where(SystemSetting.setting_id_int == val_int))
            setting = result.scalars().first()
        except Exception:
            try:
                val_int = int(setting_id)
                result = await db.execute(select(SystemSetting).where(SystemSetting.setting_id_int == val_int))
                setting = result.scalars().first()
            except Exception:
                pass
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found.")
    setting.setting_value = payload.setting_value
    if payload.description is not None:
        setting.description = payload.description
    await db.commit()
    await db.refresh(setting)
    return setting