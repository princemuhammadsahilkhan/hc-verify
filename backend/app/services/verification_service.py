import uuid
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Vote, VoteReceipt, BlockchainTransaction, DistrictSyncLog, VerificationRequest
from app.services.hash_service import verify_receipt_hash
from app.services.blockchain_service import _hash_block
from app.services.district_sync_service import SIMULATED_DISTRICTS, _hash_sync

logger = logging.getLogger(__name__)

async def verify_voter_receipt(db: AsyncSession, receipt_code: str):
    timestamp = datetime.utcnow()
    result = {
        "verification_status": "NOT VERIFIED",
        "receipt_found": False,
        "hash_valid": False,
        "blockchain_valid": False,
        "district_sync_valid": False,
        "verification_timestamp": timestamp.isoformat()
    }
    
    # 1. Locate receipt_code in Votes (this is what the voter has)
    # Wait, the user might input the verification_code from VoteReceipt instead.
    # Let's check both Vote.receipt_code and VoteReceipt.verification_code.
    # The requirement said "Input - verification_code or - receipt_id. Analyze the current project and choose whichever already exists."
    # We will use Vote.receipt_code to find the Vote, then find the VoteReceipt.
    
    vote_result = await db.execute(select(Vote).where(Vote.receipt_code == receipt_code))
    vote = vote_result.scalars().first()
    
    receipt = None
    if vote:
        receipt_result = await db.execute(select(VoteReceipt).where(VoteReceipt.vote_id == vote.id))
        receipt = receipt_result.scalars().first()
    else:
        # Maybe they entered the Layer 1 verification_code directly
        receipt_result = await db.execute(select(VoteReceipt).where(VoteReceipt.verification_code == receipt_code))
        receipt = receipt_result.scalars().first()
        
    if not receipt:
        result["verification_status"] = "RECEIPT NOT FOUND"
        await _log_verification(db, None, receipt_code, timestamp, result["verification_status"])
        return result
        
    result["receipt_found"] = True
    
    # 2. Verify Hash (Layer 2)
    hash_status = verify_receipt_hash(receipt)
    if hash_status != "VALID":
        result["verification_status"] = "HASH INVALID"
        await _log_verification(db, receipt.receipt_id, receipt_code, timestamp, result["verification_status"])
        return result
        
    result["hash_valid"] = True
    
    # 3. Verify Blockchain (Layer 3)
    block_result = await db.execute(select(BlockchainTransaction).where(BlockchainTransaction.receipt_id == receipt.receipt_id))
    block = block_result.scalars().first()
    
    if not block:
        result["verification_status"] = "BLOCKCHAIN INVALID"
        await _log_verification(db, receipt.receipt_id, receipt_code, timestamp, result["verification_status"])
        return result
        
    expected_block_hash = _hash_block(block.block_index, block.previous_block_hash, block.receipt_hash, block.timestamp)
    if expected_block_hash != block.current_block_hash or block.receipt_hash != receipt.cryptographic_hash:
        result["verification_status"] = "BLOCKCHAIN INVALID"
        await _log_verification(db, receipt.receipt_id, receipt_code, timestamp, result["verification_status"])
        return result
        
    result["blockchain_valid"] = True
    
    # 4. Verify District Sync (Layer 4)
    sync_result = await db.execute(select(DistrictSyncLog).where(DistrictSyncLog.blockchain_transaction_id == block.id))
    sync_logs = sync_result.scalars().all()
    
    if len(sync_logs) != len(SIMULATED_DISTRICTS):
        result["verification_status"] = "DISTRICT SYNC FAILED"
        await _log_verification(db, receipt.receipt_id, receipt_code, timestamp, result["verification_status"])
        return result
        
    for log in sync_logs:
        expected_sync_hash = _hash_sync(log.district_name, log.block_index, block.current_block_hash, log.sync_timestamp)
        if expected_sync_hash != log.sync_hash:
            result["verification_status"] = "DISTRICT SYNC FAILED"
            await _log_verification(db, receipt.receipt_id, receipt_code, timestamp, result["verification_status"])
            return result
            
    result["district_sync_valid"] = True
    result["verification_status"] = "VERIFIED"
    
    # Log successful verification
    await _log_verification(db, receipt.receipt_id, receipt_code, timestamp, result["verification_status"])
    
    return result

async def _log_verification(db: AsyncSession, receipt_id, verification_code: str, timestamp: datetime, status: str):
    try:
        log = VerificationRequest(
            verification_hash=verification_code,
            verified=(status == "VERIFIED"),
            verified_at=timestamp
        )
        db.add(log)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to log verification request: {e}")