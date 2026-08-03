import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from app.models import Election
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Election))
        for e in res.scalars().all():
            print(f"Election: {e.title}, ID: {e.election_id}, Status: {e.status}")

asyncio.run(run())
