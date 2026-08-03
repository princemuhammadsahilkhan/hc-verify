import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from app.models import Voter
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        try:
            res = await db.execute(select(Voter).where(Voter.voter_id == "94cb5015-79b0-51ef-aec4-d5914515477c"))
            print("Query worked!")
        except Exception as e:
            print("Query CRASHED:", type(e), e)

asyncio.run(run())
