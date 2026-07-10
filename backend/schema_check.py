import asyncio
from app.database import engine
from sqlalchemy import text

async def check():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'polling_stations'"))
        for r in res:
            print(r)

asyncio.run(check())
