import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI(title="HV Verify Cryptographic Proof Engine")

TRUST_ENGINE_URL = os.getenv("TRUST_ENGINE_URL", "http://blockchain-trust:8003")

@app.get("/proofs/generate/{vote_hash}")
async def generate_proof(vote_hash: str):
    # Contact the blockchain trust layer to get the proof
    try:
        async with httpx.AsyncClient(base_url=TRUST_ENGINE_URL) as client:
            resp = await client.get(f"/trust/verify-proof/{vote_hash}")
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Could not generate proof from Trust Engine")
            
            data = resp.json()
            if not data.get("verified"):
                raise HTTPException(status_code=400, detail="Invalid vote hash")
                
            receipt = {
                "system": "HV Verify Enterprise Edition",
                "proof_type": "Merkle Inclusion Proof",
                "vote_hash": vote_hash,
                "ledger_hash": data.get("ledger_hash"),
                "merkle_root": data.get("merkle_root"),
                "status": "VALID",
                "verification_url": f"http://localhost:8003/trust/verify-proof/{vote_hash}"
            }
            
            return JSONResponse(
                content=receipt,
                headers={"Content-Disposition": f"attachment; filename=vote_proof_{vote_hash[:8]}.json"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/proofs/health")
async def health_check():
    return {"status": "ok", "service": "proof-engine"}
