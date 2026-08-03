from fastapi.security import HTTPAuthorizationCredentials
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


async def _find_setting(setting_id: str, db: AsyncSession):
    # 1. Match by setting_key first
    result = await db.execute(select(SystemSetting).where(SystemSetting.setting_key == str(setting_id)))
    setting = result.scalars().first()
    if setting:
        return setting
    # 2. Match by UUID or integer ID
    try:
        val_uuid = uuid.UUID(str(setting_id))
        val_int = val_uuid.int & 0xFFFFFFFF
        result = await db.execute(select(SystemSetting).where(SystemSetting.setting_id_int == val_int))
        setting = result.scalars().first()
        if setting:
            return setting
    except Exception:
        pass
    try:
        val_int = int(setting_id)
        result = await db.execute(select(SystemSetting).where(SystemSetting.setting_id_int == val_int))
        setting = result.scalars().first()
        if setting:
            return setting
    except Exception:
        pass
    return None


@router.put("/{setting_id}", response_model=SystemSettingResponse)
async def update_setting(setting_id: str, payload: SystemSettingUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing system setting."""
    setting = await _find_setting(setting_id, db)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found.")
    setting.setting_value = payload.setting_value
    if payload.description is not None:
        setting.description = payload.description
    await db.commit()
    await db.refresh(setting)
    return setting


@router.delete("/{setting_id}", status_code=204)
async def delete_setting(setting_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a system setting."""
    setting = await _find_setting(setting_id, db)
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found.")
    await db.delete(setting)
    await db.commit()

