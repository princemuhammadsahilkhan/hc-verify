import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

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
    """Create a new election."""
    title_clean = (payload.title or "").strip()
    if not title_clean:
        raise HTTPException(status_code=400, detail="Title is required")

    # Check if election with this title already exists
    existing = await db.execute(select(Election).where(func.lower(Election.title) == title_clean.lower()))
    existing_election = existing.scalars().first()
    if existing_election:
        return existing_election

    new_election = Election(
        election_id=uuid.uuid4(),
        title=title_clean,
        date=payload.date,
        status=payload.status or "Upcoming",
    )
    db.add(new_election)
    await db.commit()
    await db.refresh(new_election)
    return new_election


@router.delete("/{election_id}", status_code=204)
async def delete_election(election_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete an election by UUID."""
    result = await db.execute(select(Election).where(Election.election_id == election_id))
    election = result.scalars().first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    await db.delete(election)
    await db.commit()
