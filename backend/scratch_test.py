import asyncio
import uuid
from app.database import AsyncSessionLocal
from app.services.receipt_service import generate_vote_receipt
from app.models import Vote, Voter
from sqlalchemy import text

async def test():
    async with AsyncSessionLocal() as db:
        vote = Vote(
            voter_id=1,
            candidate_id=1,
            receipt_code='RCPT-TEST2',
            vote_hash='test'
        )
        db.add(vote)
        await db.commit()
        await db.refresh(vote)
        
        receipt = await generate_vote_receipt(db, vote.id, None, 'District A', 'Station 1')
        print(f'Receipt generated: {receipt.receipt_id}')
        
        res = await db.execute(text(f"SELECT * FROM blockchain_transactions WHERE receipt_id = '{receipt.receipt_id}'"))
        row = res.fetchone()
        if row:
            print(f'Block created: {row.id}')
        else:
            print('NO BLOCK CREATED')

asyncio.run(test())
