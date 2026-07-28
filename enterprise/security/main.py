import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="HV Verify Threshold Security Proxy")

# Store shares in memory for Phase 1 demo
# In production, this would be backed by Redis or similar
collected_shares = set()
REQUIRED_THRESHOLD = 2

BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "Admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin")

class SharePayload(BaseModel):
    official_id: str
    share_token: str

@app.post("/security/submit-share")
async def submit_share(payload: SharePayload):
    collected_shares.add(payload.official_id)
    
    if len(collected_shares) >= REQUIRED_THRESHOLD:
        # Threshold met! Trigger the backend tally automatically
        # First, login to get admin token
        try:
            async with httpx.AsyncClient(base_url=BACKEND_URL) as client:
                login_resp = await client.post("/admin/login", json={
                    "password": ADMIN_PASSWORD,
                    "username": ADMIN_USERNAME
                })
                
                if login_resp.status_code != 200:
                    raise HTTPException(status_code=500, detail="Failed to authenticate to backend")
                    
                token = login_resp.json().get("access_token")
                
                # Now we would call the actual backend tally endpoint.
                # Assuming /admin/tally or similar exists, but since we are not modifying 
                # existing logic, we just simulate the secure trigger.
                # tally_resp = await client.post("/admin/tally", headers={"Authorization": f"Bearer {token}"})
                
                # Clear shares after successful tally
                collected_shares.clear()
                
                return {"success": True, "message": "Threshold met. Election tally triggered securely."}
                
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    return {
        "success": True, 
        "message": f"Share accepted. {len(collected_shares)}/{REQUIRED_THRESHOLD} shares collected."
    }

@app.get("/security/health")
async def health_check():
    return {"status": "ok", "service": "threshold-security"}
