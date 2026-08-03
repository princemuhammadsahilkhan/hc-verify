import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from app.database import AsyncSessionLocal
from app.models import Voter, Candidate
from sqlalchemy import select

async def run():
    async with AsyncSessionLocal() as db:
        v = (await db.execute(select(Voter))).scalars().first()
        c = (await db.execute(select(Candidate))).scalars().first()
        print(f"Voter: {v.voter_id if v else None}, Candidate: {c.candidate_id if c else None}")
        
        if not v or not c:
            print("Missing voter or candidate")
            return

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
