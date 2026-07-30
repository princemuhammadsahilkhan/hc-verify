import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.database import DATABASE_URL

async def fix_schema():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE voters ADD COLUMN is_verified BOOLEAN DEFAULT TRUE"))
            print("Added is_verified")
        except Exception as e:
            print("is_verified:", e)
            
        try:
            await conn.execute(text("ALTER TABLE voters ADD COLUMN is_pending BOOLEAN DEFAULT FALSE"))
            print("Added is_pending")
        except Exception as e:
            print("is_pending:", e)
            
        try:
            await conn.execute(text("ALTER TABLE voters ADD COLUMN pending_reason VARCHAR"))
            print("Added pending_reason")
        except Exception as e:
            print("pending_reason:", e)
            
        try:
            await conn.execute(text("ALTER TABLE voters ADD COLUMN face_embedding TEXT"))
            print("Added face_embedding")
        except Exception as e:
            print("face_embedding:", e)
            
        try:
            await conn.execute(text("ALTER TABLE voters ADD COLUMN registration_hash VARCHAR"))
            print("Added registration_hash")
        except Exception as e:
            print("registration_hash:", e)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_schema())
