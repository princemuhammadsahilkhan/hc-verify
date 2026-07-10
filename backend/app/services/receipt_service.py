import uuid
import random
import string
import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import VoteReceipt, Election
from app.services.hash_service import generate_receipt_hash
from app.services.blockchain_service import add_block
from app.services.district_sync_service import sync_block

logger = logging.getLogger(__name__)

async def generate_vote_receipt(db: AsyncSession, vote_id: int, election_id: uuid.UUID = None, district: str = None, polling_station: str = None):
    try:
        # Generate a random 12 character verification code (alphanumeric)
        verification_code = 'VC-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

        receipt = VoteReceipt(
            receipt_id=uuid.uuid4(),
            vote_id=vote_id,
            election_id=election_id,
            timestamp=datetime.utcnow(),
            polling_station=polling_station,
            district=district,
            verification_code=verification_code,
            status='Generated'
        )

        db.add(receipt)
        await db.commit()
        await db.refresh(receipt)
        
        # Layer 2: Generate Cryptographic Hash after commit
        try:
            hash_val = generate_receipt_hash(receipt)
            receipt.cryptographic_hash = hash_val
            await db.commit()
            await db.refresh(receipt)
            
            # Layer 3: Append to Simulated Blockchain
            try:
                new_block = await add_block(db, receipt.receipt_id, hash_val)
                
                # Layer 4: Simulated District Synchronization
                # Rule 8: Sync failures never affect votes/receipts/hashes/blockchain
                try:
                    await sync_block(db, new_block)
                except Exception as sync_e:
                    logger.error(f"Failed to synchronize block to districts: {sync_e}")
                    
            except Exception as block_e:
                logger.error(f"Failed to add blockchain block for receipt {receipt.receipt_id}: {block_e}")
                raise block_e
                
        except Exception as hash_e:
            # Rule 6: If hash generation fails, log it but never roll back or delete the receipt
            logger.error(f"Failed to generate hash for receipt {receipt.receipt_id}: {hash_e}")
            raise hash_e

        return receipt
    except Exception as e:
        # Log the error, but do NOT re-raise to ensure the vote is not rolled back
        logger.error(f"Failed to generate vote receipt for vote_id {vote_id}: {e}")
        return None