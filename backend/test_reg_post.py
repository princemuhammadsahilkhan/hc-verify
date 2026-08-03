import requests

payload = {
    "full_name": "Test User",
    "email": "testreg@example.com",
    "password": "Password123!",
    "district": "362f0fb8-fcee-469f-91db-1cf57d4c2082"
}
res = requests.post("http://localhost:8000/auth/register", json=payload)
print(res.status_code)
print(res.text)
