import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from sqlalchemy import text

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(text("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'voters';"))
        for row in res.fetchall():
            print(row)

asyncio.run(run())
