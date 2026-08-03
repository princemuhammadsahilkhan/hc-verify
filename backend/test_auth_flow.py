import requests

print("Registering...")
payload = {
    "full_name": "Auth Flow Test",
    "email": "authflow@example.com",
    "password": "Password123",
    "district": "peshawar"
}
res = requests.post("http://localhost:8000/auth/register", json=payload)
print(res.status_code, res.text)

print("Logging in...")
login_payload = {
    "email": "authflow@example.com",
    "password": "Password123"
}
res2 = requests.post("http://localhost:8000/auth/login", json=login_payload)
print(res2.status_code, res2.text)
