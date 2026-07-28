import hashlib
import uuid
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.models import DistrictSyncLog, BlockchainTransaction

logger = logging.getLogger(__name__)

SIMULATED_DISTRICTS = ["District A", "District B", "District C", "District D"]

from datetime import datetime, timezone

def _hash_sync(district: str, block_index: int, block_hash: str, timestamp: datetime) -> str:
    if timestamp.tzinfo is not None:
        t_utc = timestamp.astimezone(timezone.utc).replace(tzinfo=None)
    else:
        t_utc = timestamp
    t_str = t_utc.isoformat()
    payload = f"{district}|{block_index}|{block_hash}|{t_str}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

async def sync_block(db: AsyncSession, block: BlockchainTransaction):
    try:
        timestamp = datetime.utcnow()
        for district in SIMULATED_DISTRICTS:
            sync_hash = _hash_sync(district, block.block_index, block.current_block_hash, timestamp)
            
            sync_log = DistrictSyncLog(
                district_name=district,
                blockchain_transaction_id=block.id,
                block_index=block.block_index,
                receipt_id=block.receipt_id,
                sync_timestamp=timestamp,
                sync_hash=sync_hash,
                sync_status="Synced"
            )
            db.add(sync_log)
            
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to synchronize block {block.block_index} to districts: {e}")
        # Rule 8: Sync failures never affect votes/receipts/hashes/blockchain
        return False
    return True

async def verify_synchronization(db: AsyncSession):
    # Fetch all sync logs ordered by block index and district
    result = await db.execute(select(DistrictSyncLog).order_by(DistrictSyncLog.block_index, DistrictSyncLog.district_name))
    logs = result.scalars().all()
    
    if not logs:
        return "SYNCED"
        
    # Group logs by block_index
    from collections import defaultdict
    block_logs = defaultdict(list)
    for log in logs:
        block_logs[log.block_index].append(log)
        
    for index, d_logs in block_logs.items():
        # Check if all simulated districts received the block
        if len(d_logs) != len(SIMULATED_DISTRICTS):
            return "OUT_OF_SYNC"
            
        # Verify block hashes are identical across all districts
        expected_blockchain_id = d_logs[0].blockchain_transaction_id
        for log in d_logs:
            if log.blockchain_transaction_id != expected_blockchain_id:
                return "OUT_OF_SYNC"
                
            # Fetch actual block to recompute sync hash
            block_result = await db.execute(select(BlockchainTransaction).where(BlockchainTransaction.id == log.blockchain_transaction_id))
            block = block_result.scalars().first()
            if not block:
                return "OUT_OF_SYNC"
                
            expected_hash = _hash_sync(log.district_name, log.block_index, block.current_block_hash, log.sync_timestamp)
            if expected_hash != log.sync_hash:
                return "OUT_OF_SYNC"
                
    return "SYNCED"

# FYP Helper Methods
async def get_all_sync_logs(db: AsyncSession):
    result = await db.execute(select(DistrictSyncLog).order_by(DistrictSyncLog.created_at))
    return result.scalars().all()

async def get_sync_by_district(db: AsyncSession, district: str):
    result = await db.execute(select(DistrictSyncLog).where(DistrictSyncLog.district_name == district).order_by(DistrictSyncLog.block_index))
    return result.scalars().all()

async def get_sync_by_block(db: AsyncSession, block_index: int):
    result = await db.execute(select(DistrictSyncLog).where(DistrictSyncLog.block_index == block_index))
    return result.scalars().all()

async def verify_all_districts(db: AsyncSession):
    return await verify_synchronization(db)