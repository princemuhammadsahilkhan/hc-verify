import asyncio
from sqlalchemy import text
from app.database import engine

async def alter():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE polling_stations ADD COLUMN IF NOT EXISTS address VARCHAR(500);"))
        await conn.execute(text("ALTER TABLE polling_stations ADD COLUMN IF NOT EXISTS capacity INTEGER;"))
    print('Table altered')

asyncio.run(alter())
