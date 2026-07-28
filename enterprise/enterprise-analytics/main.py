import sqlite3
from fastapi import FastAPI, HTTPException

app = FastAPI(title="HV Verify Enterprise Analytics")

LEDGER_DB = "/app/ledger/ledger.db"

@app.get("/analytics/turnout")
async def get_turnout():
    try:
        conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
        cursor = conn.cursor()
        
        # Calculate votes per hour
        cursor.execute('''
            SELECT strftime('%Y-%m-%d %H:00:00', timestamp) as hour, count(*) as total
            FROM immutable_votes
            GROUP BY hour
            ORDER BY hour DESC
            LIMIT 24
        ''')
        hourly_turnout = cursor.fetchall()
        
        cursor.execute("SELECT count(*) FROM immutable_votes")
        total_votes = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_votes_recorded": total_votes,
            "hourly_trend": [{"hour": r[0], "votes": r[1]} for r in hourly_turnout]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Analytics data unavailable")

@app.get("/analytics/security-metrics")
async def get_security_metrics():
    # In a full implementation, this reads from audit_evidence.db
    # To keep this phase simple, we'll return a static mock or basic count
    return {
        "tampering_attempts_detected": 0,
        "failed_signatures": 0,
        "system_status": "SECURE"
    }

@app.get("/analytics/health")
async def health_check():
    return {"status": "ok", "service": "enterprise-analytics"}
