import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Election
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin/elections", tags=["Admin Elections"])


class ElectionCreate(BaseModel):
    title: str
    date: datetime
    status: str = "Upcoming"


class ElectionResponse(BaseModel):
    election_id: uuid.UUID
    title: str
    date: datetime
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ElectionResponse])
async def get_all_elections(db: AsyncSession = Depends(get_db)):
    """Return all elections from the database."""
    result = await db.execute(select(Election).order_by(Election.created_at.desc()))
    return result.scalars().all()


@router.get("/{election_id}", response_model=ElectionResponse)
async def get_election(election_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Return a single election by UUID."""
    result = await db.execute(select(Election).where(Election.election_id == election_id))
    election = result.scalars().first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    return election


@router.post("/", response_model=ElectionResponse, status_code=201)
async def create_election(payload: ElectionCreate, db: AsyncSession = Depends(get_db)):
    admin_user = locals().get('admin_user') or locals().get('_', {})
    if admin_user.get('role_name') in ['auditor', 'observer', 'voter', 'technical_support']:
        raise HTTPException(status_code=403, detail='Role is read-only and cannot perform this action.')
    """Create a new election."""
    new_election = Election(
        election_id=uuid.uuid4(),
        title=payload.title,
        date=payload.date,
        status=payload.status,
    )
    db.add(new_election)
    await db.commit()
    await db.refresh(new_election)
    return new_election


@router.delete("/{election_id}", status_code=204)
async def delete_election(election_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    admin_user = locals().get('admin_user') or locals().get('_', {})
    if admin_user.get('role_name') in ['auditor', 'observer', 'voter', 'technical_support']:
        raise HTTPException(status_code=403, detail='Role is read-only and cannot perform this action.')
    """Delete an election by UUID."""
    result = await db.execute(select(Election).where(Election.election_id == election_id))
    election = result.scalars().first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    await db.delete(election)
    await db.commit()
