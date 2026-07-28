import sqlite3
import csv
import io
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

app = FastAPI(title="HV Verify Data Export Engine")

LEDGER_DB = "/app/ledger/ledger.db"

@app.get("/export/csv")
async def export_csv():
    try:
        # We use a generator to stream data, avoiding memory crashes on massive datasets
        def iter_csv():
            conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
            cursor = conn.cursor()
            cursor.execute("SELECT original_vote_id, candidate_id, timestamp, ledger_hash FROM immutable_votes")
            
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["VoteID", "CandidateID", "Timestamp", "LedgerHash"])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
            while True:
                rows = cursor.fetchmany(1000)
                if not rows:
                    break
                for row in rows:
                    writer.writerow(row)
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)
                
            conn.close()
            
        response = StreamingResponse(iter_csv(), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=election_export.csv"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail="Export failed")

@app.get("/export/health")
async def health_check():
    return {"status": "ok", "service": "data-export"}
