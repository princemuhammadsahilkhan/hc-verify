import asyncio
from sqlalchemy import text
from app.database import engine

async def reset_sequences():
    async with engine.begin() as conn:
        if "postgresql" in str(engine.url):
            print("Resetting PostgreSQL sequences...")
            tables = ['candidates', 'voters', 'votes', 'audit_logs']
            for table in tables:
                try:
                    query = f"SELECT setval('{table}_id_seq', COALESCE((SELECT MAX(id) FROM {table}), 1), (SELECT MAX(id) IS NOT NULL FROM {table}));"
                    await conn.execute(text(query))
                    print(f"Reset sequence for {table}")
                except Exception as e:
                    print(f"Error resetting {table}: {e}")
        else:
            print("Not PostgreSQL, skipping sequence reset.")

if __name__ == "__main__":
    asyncio.run(reset_sequences())
