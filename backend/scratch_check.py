import asyncio
from sqlalchemy import text
from app.database import engine

async def main():
    async with engine.begin() as conn:
        result = await conn.run_sync(lambda sync_conn: sync_conn.execute(text("PRAGMA table_info(candidates);")).fetchall())
        print(result)

if __name__ == "__main__":
    asyncio.run(main())
