import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models import District
from app.utils.security import require_admin, enforce_role
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin/districts", tags=["Admin Districts"])


class DistrictCreate(BaseModel):
    district_name: str


class DistrictResponse(BaseModel):
    district_id: uuid.UUID
    district_name: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[DistrictResponse])
async def get_all_districts(db: AsyncSession = Depends(get_db), current_admin: dict = Depends(require_admin)):
    """Return all districts from the database."""
    if current_admin.get("role_name") == "technical_support":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = select(District).order_by(District.district_name)
    
    grantor_level = current_admin.get("level", 10)
    is_env_bypass = current_admin.get("is_env_bypass", False)
    
    if not is_env_bypass:
        from app.models import User
        admin_res = await db.execute(select(User).where(User.username == current_admin.get("sub")))
        admin_user = admin_res.scalars().first()
        if admin_user:
            if grantor_level == 80:
                query = query.where(District.state_id == admin_user.state_id)
            elif grantor_level == 70:
                query = query.where(District.district_id == admin_user.district_id)
                
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{district_id}", response_model=DistrictResponse)
async def get_district(district_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin_user: dict = Depends(require_admin)):
    """Return a single district by UUID."""
    if admin_user.get("role_name") == "technical_support":
        raise HTTPException(status_code=403, detail="Forbidden")
    query = select(District).where(District.district_id == district_id)
    if admin_user.get("role_name") == "district_admin" and str(admin_user.get("district_id")) != str(district_id):
        raise HTTPException(status_code=403, detail="Forbidden")
    result = await db.execute(query)
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district


@router.post("/", response_model=DistrictResponse, status_code=201)
async def create_district(payload: DistrictCreate, db: AsyncSession = Depends(get_db), admin_user: dict = Depends(require_admin)):
    """Create a new district."""
    name = (payload.district_name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="District name is required.")
    
    existing = await db.execute(
        select(District).where(func.lower(District.district_name) == name.lower())
    )
    dist_obj = existing.scalars().first()
    if dist_obj:
        return dist_obj

    new_district = District(
        district_id=uuid.uuid4(),
        district_name=name,
    )
    db.add(new_district)
    await db.commit()
    await db.refresh(new_district)
    return new_district


@router.delete("/{district_id}", status_code=204)
async def delete_district(district_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin_user: dict = Depends(require_admin)):
    """Delete a district by UUID."""
    result = await db.execute(select(District).where(District.district_id == district_id))
    district = result.scalars().first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    await db.delete(district)
    await db.commit()
