import uuid as uuid_lib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models import PollingStation

router = APIRouter(prefix="/admin/polling-stations", tags=["Polling Stations"])


class PollingStationCreate(BaseModel):
    station_name: str
    address: Optional[str] = None
    district_id: Optional[str] = None
    capacity: Optional[int] = None


class PollingStationResponse(BaseModel):
    station_id: uuid_lib.UUID
    station_name: str
    address: Optional[str] = None
    district_id: Optional[uuid_lib.UUID] = None
    capacity: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[PollingStationResponse])
async def get_polling_stations(db: AsyncSession = Depends(get_db)):
    """Return all polling stations."""
    result = await db.execute(select(PollingStation).order_by(PollingStation.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=PollingStationResponse, status_code=201)
async def create_polling_station(payload: PollingStationCreate, db: AsyncSession = Depends(get_db)):
    """Create a new polling station."""
    name_clean = (payload.station_name or "").strip()
    if not name_clean:
        raise HTTPException(status_code=400, detail="Station name is required.")

    existing = await db.execute(select(PollingStation).where(func.lower(PollingStation.station_name) == name_clean.lower()))
    existing_st = existing.scalars().first()
    if existing_st:
        return existing_st

    district_uuid = None
    if payload.district_id and str(payload.district_id).strip():
        try:
            district_uuid = uuid_lib.UUID(str(payload.district_id).strip())
        except Exception:
            pass

    import random
    import string
    random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    station_code = f"ST-{random_suffix}"

    station = PollingStation(
        station_id=uuid_lib.uuid4(),
        station_name=name_clean,
        station_code=station_code,
        address=payload.address or "",
        district_id=district_uuid,
        capacity=payload.capacity
    )
    db.add(station)
    await db.commit()
    await db.refresh(station)
    return station


@router.delete("/{station_id}", status_code=204)
async def delete_polling_station(station_id: uuid_lib.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a polling station by ID."""
    result = await db.execute(select(PollingStation).where(PollingStation.station_id == station_id))
    station = result.scalars().first()
    if not station:
        raise HTTPException(status_code=404, detail="Polling station not found.")
    await db.delete(station)
    await db.commit()
