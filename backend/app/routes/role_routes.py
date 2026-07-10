from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import Role

router = APIRouter(prefix="/admin/roles", tags=["Roles"])


class RoleCreate(BaseModel):
    role_name: str
    description: Optional[str] = None


class RoleResponse(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[RoleResponse])
async def get_roles(db: AsyncSession = Depends(get_db)):
    """Return all roles from the database."""
    result = await db.execute(select(Role).order_by(Role.role_id))
    return result.scalars().all()


@router.post("/", response_model=RoleResponse, status_code=201)
async def create_role(payload: RoleCreate, db: AsyncSession = Depends(get_db)):
    """Create a new role."""
    existing = await db.execute(select(Role).where(Role.role_name == payload.role_name))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Role with this name already exists.")
    new_role = Role(role_name=payload.role_name, description=payload.description)
    db.add(new_role)
    await db.commit()
    await db.refresh(new_role)
    return new_role


@router.delete("/{role_id}", status_code=204)
async def delete_role(role_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a role by ID."""
    result = await db.execute(select(Role).where(Role.role_id == role_id))
    role = result.scalars().first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")
    await db.delete(role)
    await db.commit()
