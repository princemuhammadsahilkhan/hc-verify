import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from app.models import Election
from sqlalchemy import select
from datetime import datetime, timezone

async def check_elections():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Election))
        elections = result.scalars().all()
        now = datetime.now(timezone.utc)
        print("Current time (UTC):", now)
        for e in elections:
            print(f"Election: {e.title}")
            print(f"  start_time: {e.date}")
            print(f"  end_time: {e.end_time}")
            
            start_time = e.date if e.date.tzinfo else e.date.replace(tzinfo=timezone.utc)
            if now < start_time:
                status = "Upcoming"
            elif e.end_time:
                end_time = e.end_time if e.end_time.tzinfo else e.end_time.replace(tzinfo=timezone.utc)
                if now > end_time:
                    status = "Closed"
                else:
                    status = "Active"
            else:
                status = "Active"
            print(f"  computed status: {status}")

if __name__ == "__main__":
    asyncio.run(check_elections())
