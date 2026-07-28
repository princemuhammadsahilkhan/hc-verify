import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="HV Verify Public Transparency Portal")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

LEDGER_DB = "/app/ledger/ledger.db"

@app.get("/api/public/v1/ledger")
async def get_public_ledger(limit: int = 50, offset: int = 0):
    try:
        conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT original_vote_id, candidate_id, vote_hash, timestamp, ledger_hash FROM immutable_votes ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset)
        )
        rows = cursor.fetchall()
        
        cursor.execute("SELECT count(*) FROM immutable_votes")
        total = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_votes": total,
            "limit": limit,
            "offset": offset,
            "data": [dict(row) for row in rows]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ledger unavailable")

@app.get("/api/public/v1/bulletin")
async def get_bulletin_board():
    try:
        conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
        cursor = conn.cursor()
        
        cursor.execute("SELECT candidate_id, count(*) FROM immutable_votes GROUP BY candidate_id")
        results = cursor.fetchall()
        conn.close()
        
        return {
            "status": "LIVE",
            "results": [{"candidate_id": r[0], "votes": r[1]} for r in results]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Bulletin unavailable")

@app.get("/public/health")
async def health_check():
    return {"status": "ok", "service": "public-portal"}
