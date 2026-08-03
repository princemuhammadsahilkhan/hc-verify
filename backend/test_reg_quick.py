import requests
try:
    res = requests.post("http://localhost:8000/register", json={
        "full_name": "Test User",
        "cnic": "12345-6789012-3",
        "phone": "03001234567",
        "constituency": "NA-1"
    })
    print("Status:", res.status_code)
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)
