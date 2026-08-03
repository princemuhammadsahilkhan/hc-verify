import requests
from app.utils.jwt_handler import create_access_token
import uuid

# create a token
token = create_access_token({
    "sub": "voter",
    "role": "voter",
    "voter_id": str(uuid.uuid4())
})

# hit /register
payload = {
    "full_name": "Test User",
    "cnic": "11111-2222222-3",
    "phone": "03001234567",
    "constituency": "NA-1"
}

headers = {
    "Authorization": f"Bearer {token}"
}

try:
    res = requests.post("http://localhost:8000/register", json=payload, headers=headers)
    print("Status code:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)
