import urllib.request
import json
import urllib.error

payload = json.dumps({
    "voter_id": "22de06a9-6d36-5fc4-89d8-d8da9fecbe2c",
    "candidate_id": "51b21659-5cb2-4555-8eb2-c84660269dd5"
}).encode('utf-8')

req = urllib.request.Request("http://localhost:8000/vote", data=payload, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        print("Response JSON:", json.loads(response.read()))
except urllib.error.HTTPError as e:
    print("Status Code:", e.code)
    print("Response body:", e.read().decode())
