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
            res = await db.execute(select(Voter).where(Voter.email == "test"))
            print("Query succeeded!")
        except Exception as e:
            print("Query failed:", e)

asyncio.run(run())
