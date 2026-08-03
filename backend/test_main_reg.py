import requests
import uuid
import random

payload = {
    "full_name": f"User {uuid.uuid4()}",
    "cnic": f"{random.randint(10000, 99999)}-{random.randint(1000000, 9999999)}-{random.randint(0, 9)}",
    "phone": f"0300{random.randint(1000000, 9999999)}",
    "constituency": "NA-122"
}
res = requests.post("http://localhost:8000/register", json=payload)
print(res.status_code)
print(res.text)
