import asyncio
import sys
import os
import urllib.request
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from app.models import Voter, Candidate, District
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        v = (await db.execute(select(Voter))).scalars().first()
        c = (await db.execute(select(Candidate))).scalars().first()
        
        c.district_id = v.district_id
        await db.commit()
        
        # Check names as evaluated by the backend
        voter_district_name = (v.district or getattr(v, "constituency", "") or "").strip()
        if not voter_district_name and v.district_id:
            v_dist_obj = (await db.execute(select(District).where(District.district_id == v.district_id))).scalars().first()
            if v_dist_obj:
                voter_district_name = v_dist_obj.district_name.strip()

        candidate_district_name = ""
        if c.district_id:
            c_dist_obj = (await db.execute(select(District).where(District.district_id == c.district_id))).scalars().first()
            if c_dist_obj:
                candidate_district_name = c_dist_obj.district_name.strip()
                
        print(f"Voter District Name: {voter_district_name}")
        print(f"Candidate District Name: {candidate_district_name}")

asyncio.run(run())
