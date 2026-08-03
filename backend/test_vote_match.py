import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from app.database import AsyncSessionLocal
from app.models import Voter, Candidate, District
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def run():
    async with AsyncSessionLocal() as db:
        v = (await db.execute(select(Voter))).scalars().first()
        c = (await db.execute(select(Candidate))).scalars().first()
        
        # Match candidate district to voter district so it passes the check
        c.district_id = v.district_id
        await db.commit()
        
        print(f"Voter: {v.voter_id}, Candidate: {c.candidate_id}")
        
        client = TestClient(app)
        payload = {
            "voter_id": str(v.voter_id),
            "candidate_id": str(c.candidate_id)
        }

        response = client.post("/vote", json=payload)
        print("Status Code:", response.status_code)
        if response.status_code != 200:
            print("Response body:", response.text)
        else:
            print("Response JSON:", response.json())

asyncio.run(run())
