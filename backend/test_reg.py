import requests
import json

base_url = "http://127.0.0.1:8000"

# test auth register
print("Testing /auth/register...")
payload = {
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "district": "Peshawar"
}
try:
    res = requests.post(f"{base_url}/auth/register", json=payload)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print(e)

# test regular register
print("\nTesting /register...")
payload = {
    "full_name": "Test User 2",
    "cnic": "12345-6789012-3",
    "phone": "03001234567",
    "constituency": "Peshawar"
}
try:
    res = requests.post(f"{base_url}/register", json=payload)
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print(e)
