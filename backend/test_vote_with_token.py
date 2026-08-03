import requests
from app.utils.jwt_handler import create_access_token
import uuid
import asyncio
from app.database import AsyncSessionLocal
from app.models import Voter, Candidate
from sqlalchemy import select

async def get_test_data():
    async with AsyncSessionLocal() as db:
        voter = (await db.execute(select(Voter))).scalars().first()
        candidate = (await db.execute(select(Candidate))).scalars().first()
        return voter.voter_id, candidate.candidate_id

voter_id, candidate_id = asyncio.run(get_test_data())

token = create_access_token({
    "sub": "Standard",
    "role": "voter",
    "voter_id": str(voter_id)
})

payload = {
    "voter_id": str(voter_id),
    "candidate_id": str(candidate_id)
}

headers = {
    "Authorization": f"Bearer {token}"
}

print(f"Token: {token}")

res = requests.post("http://localhost:8000/vote", json=payload, headers=headers)
print("Status:", res.status_code)
print("Body:", res.text)
