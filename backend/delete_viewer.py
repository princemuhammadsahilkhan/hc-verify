import asyncio
from sqlalchemy import text
from app.database import engine

async def main():
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM roles WHERE role_name='viewer'"))
        print("Deleted viewer role")

if __name__ == "__main__":
    asyncio.run(main())
