import asyncio
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from app.models import Election
from sqlalchemy.future import select

async def run():
    async with AsyncSessionLocal() as db:
        elections_res = await db.execute(select(Election).order_by(Election.created_at.desc()))
        elections = elections_res.scalars().all()
        active_election_exists = False
        active_election_id = None
        now = datetime.now(timezone.utc)
        
        print("Now:", now)
        for e in elections:
            start_time = e.date if e.date.tzinfo else e.date.replace(tzinfo=timezone.utc)
            print("Election:", e.title, "Start:", start_time, "End:", e.end_time)
            if now >= start_time:
                if e.end_time:
                    end_time = e.end_time if e.end_time.tzinfo else e.end_time.replace(tzinfo=timezone.utc)
                    if now <= end_time:
                        active_election_exists = True
                        active_election_id = e.election_id
                        break
                else:
                    active_election_exists = True
                    active_election_id = e.election_id
                    break
        print("Active election exists:", active_election_exists)
        print("Active election id:", active_election_id)

asyncio.run(run())
