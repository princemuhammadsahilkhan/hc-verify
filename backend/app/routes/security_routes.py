from fastapi.security import HTTPAuthorizationCredentials
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import SecurityIncident
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin/security", tags=["Admin Security"])


class SecurityIncidentCreate(BaseModel):
    incident_type: str
    severity: str
    description: str


class SecurityIncidentResponse(BaseModel):
    incident_id: uuid.UUID
    incident_type: str
    severity: str
    description: str
    resolved: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[SecurityIncidentResponse])
async def get_all_incidents(db: AsyncSession = Depends(get_db)):
    """Return all security incidents from the database."""
    result = await db.execute(select(SecurityIncident).order_by(SecurityIncident.created_at.desc()))
    return result.scalars().all()


from app.utils.security import require_admin, enforce_role

@router.post("/", response_model=SecurityIncidentResponse, status_code=201)
async def create_incident(payload: SecurityIncidentCreate, db: AsyncSession = Depends(get_db), admin_user: dict = Depends(require_admin)):
    """Create a new security incident."""
    new_incident = SecurityIncident(
        incident_id=uuid.uuid4(),
        incident_type=payload.incident_type,
        severity=payload.severity,
        description=payload.description,
    )
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)
    return new_incident