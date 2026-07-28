import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import BlockchainNode
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin/blockchain", tags=["Admin Blockchain"])


class BlockchainNodeCreate(BaseModel):
    node_name: str
    node_url: str
    status: str = "Active"


class BlockchainNodeResponse(BaseModel):
    node_id: uuid.UUID
    node_name: str
    node_url: str
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[BlockchainNodeResponse])
async def get_all_nodes(db: AsyncSession = Depends(get_db)):
    """Return all blockchain nodes from the database."""
    result = await db.execute(select(BlockchainNode).order_by(BlockchainNode.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=BlockchainNodeResponse, status_code=201)
async def create_node(payload: BlockchainNodeCreate, db: AsyncSession = Depends(get_db)):
    """Create a new blockchain node."""
    new_node = BlockchainNode(
        node_id=uuid.uuid4(),
        node_name=payload.node_name,
        node_url=payload.node_url,
        status=payload.status,
    )
    db.add(new_node)
    await db.commit()
    await db.refresh(new_node)
    return new_node


@router.delete("/{node_id}", status_code=204)
async def delete_node(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a blockchain node by UUID."""
    result = await db.execute(select(BlockchainNode).where(BlockchainNode.node_id == node_id))
    node = result.scalars().first()
    if not node:
        raise HTTPException(status_code=404, detail="Blockchain node not found")
    await db.delete(node)
    await db.commit()
