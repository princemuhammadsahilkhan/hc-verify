import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import AsyncSessionLocal
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

response = client.get("/public/elections")
print("Status Code:", response.status_code)
if response.status_code != 200:
    print("Response body:", response.text)
else:
    print("Response JSON:", response.json())
