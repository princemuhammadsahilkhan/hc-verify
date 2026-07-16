import requests
import time

BASE_URL = "http://127.0.0.1:8000"

print("--- Testing Super Admin Login ---")
login_resp = requests.post(
    f"{BASE_URL}/admin/login",
    json={"email": "Admin", "password": "Admin"}
)
if login_resp.status_code != 200:
    print("Failed to login as Super Admin:", login_resp.text)
else:
    token = login_resp.json()["access_token"]
    print("Super Admin logged in successfully.")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n--- Testing Grant Commissioner ---")
    grant_resp = requests.post(
        f"{BASE_URL}/admin/grants/",
        json={
            "email": "livecommissioner@example.com",
            "full_name": "Live Comm",
            "role_name": "election_commissioner"
        },
        headers=headers
    )
    if grant_resp.status_code == 201:
        print("Success! Response:", grant_resp.json())
        invite_token = grant_resp.json()["invite_token"]
        
        print("\n--- Testing Accept Invite ---")
        accept_resp = requests.post(
            f"{BASE_URL}/admin/grants/accept-invite",
            json={
                "invite_token": invite_token,
                "new_password": "MyNewPassword!1"
            }
        )
        print("Accept Invite Response:", accept_resp.json())
        
        print("\n--- Testing Login as New Commissioner ---")
        comm_login = requests.post(
            f"{BASE_URL}/admin/login",
            json={"email": "livecommissioner@example.com", "password": "MyNewPassword!1"}
        )
        print("Commissioner Login Response Status:", comm_login.status_code)
        if comm_login.status_code == 200:
             print("Commissioner Token snippet:", comm_login.json()["access_token"][:20])
    else:
        print("Failed to grant commissioner:", grant_resp.status_code, grant_resp.text)
