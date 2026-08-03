import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from app.models import Candidate
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        c_res = await db.execute(select(Candidate))
        candidates = c_res.scalars().all()
        for c in candidates:
            print(f"Candidate: {c.full_name}, District ID: {c.district_id}, Election ID: {c.election_id}")

asyncio.run(run())
