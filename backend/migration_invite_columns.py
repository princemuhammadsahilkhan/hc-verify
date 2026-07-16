import asyncio
from sqlalchemy import text
from app.database import engine

async def run_migration():
    async with engine.begin() as conn:
        print("Adding invite_token_hash and invite_expires_at to users...")
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN invite_token_hash VARCHAR(255)"))
        except Exception as e:
            if "duplicate column name" not in str(e).lower() and "already exists" not in str(e).lower():
                print(f"Warning/Error altering users: {e}")

        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN invite_expires_at TIMESTAMP WITH TIME ZONE"))
        except Exception as e:
            if "duplicate column name" not in str(e).lower() and "already exists" not in str(e).lower():
                print(f"Warning/Error altering users: {e}")
                
    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(run_migration())
