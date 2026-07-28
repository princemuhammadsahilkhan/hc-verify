import os
import sqlite3
import httpx
from fastapi import FastAPI, HTTPException

app = FastAPI(title="HV Verify Lifecycle Timeline")

SOURCE_DB = "/app/data/hc_verify.db"
LEDGER_DB = "/app/ledger/ledger.db"
TRUST_ENGINE_URL = os.getenv("TRUST_ENGINE_URL", "http://blockchain-trust:8003")

@app.get("/verification/timeline/{vote_hash}")
async def get_timeline(vote_hash: str):
    timeline = []
    
    # 1. Check original database
    try:
        conn = sqlite3.connect(f"file:{SOURCE_DB}?mode=ro", uri=True)
        cursor = conn.cursor()
        cursor.execute("SELECT timestamp FROM votes WHERE vote_hash = ?", (vote_hash,))
        row = cursor.fetchone()
        if row:
            timeline.append({
                "stage": "Vote Cast",
                "timestamp": row[0],
                "status": "Success",
                "layer": "Core Backend"
            })
        conn.close()
    except Exception as e:
        pass

    # 2. Check immutable ledger
    try:
        conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
        cursor = conn.cursor()
        cursor.execute("SELECT timestamp, ledger_hash FROM immutable_votes WHERE vote_hash = ?", (vote_hash,))
        row = cursor.fetchone()
        if row:
            timeline.append({
                "stage": "Synced to Immutable Ledger",
                "timestamp": row[0],
                "ledger_hash": row[1],
                "status": "Success",
                "layer": "Ledger Engine"
            })
        conn.close()
    except Exception as e:
        pass
        
    # 3. Check Blockchain Trust (Merkle Tree)
    try:
        async with httpx.AsyncClient(base_url=TRUST_ENGINE_URL) as client:
            resp = await client.get(f"/trust/verify-proof/{vote_hash}")
            if resp.status_code == 200 and resp.json().get("verified"):
                timeline.append({
                    "stage": "Anchored in Blockchain Merkle Tree",
                    "status": "Success",
                    "merkle_root": resp.json().get("merkle_root"),
                    "layer": "Trust Engine"
                })
    except Exception as e:
        pass
        
    if not timeline:
        raise HTTPException(status_code=404, detail="Vote not found across any layer")
        
    return {"vote_hash": vote_hash, "timeline": timeline}

@app.get("/verification/health")
async def health_check():
    return {"status": "ok", "service": "advanced-verification"}
