import os
import time
import sqlite3
import datetime

SOURCE_DB = "/app/data/hc_verify.db"
LEDGER_DB = "/app/ledger/ledger.db"
AUDIT_DB = "/app/audit/audit_evidence.db"

def init_audit_db():
    conn = sqlite3.connect(AUDIT_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS anomalies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anomaly_type TEXT,
            description TEXT,
            detected_at DATETIME,
            vote_hash TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_anomaly(anomaly_type, description, vote_hash):
    conn = sqlite3.connect(AUDIT_DB)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO anomalies (anomaly_type, description, detected_at, vote_hash)
        VALUES (?, ?, ?, ?)
    ''', (anomaly_type, description, datetime.datetime.utcnow().isoformat(), vote_hash))
    conn.commit()
    conn.close()
    print(f"ANOMALY DETECTED: {anomaly_type} - {description}")

def run_audit():
    if not os.path.exists(SOURCE_DB) or not os.path.exists(LEDGER_DB):
        print("Waiting for databases...")
        return
        
    try:
        # Get all votes from source
        src_conn = sqlite3.connect(f"file:{SOURCE_DB}?mode=ro", uri=True)
        src_cursor = src_conn.cursor()
        src_cursor.execute("SELECT vote_hash FROM votes")
        source_votes = set([row[0] for row in src_cursor.fetchall()])
        src_conn.close()
        
        # Get all votes from ledger
        ldr_conn = sqlite3.connect(f"file:{LEDGER_DB}?mode=ro", uri=True)
        ldr_cursor = ldr_conn.cursor()
        ldr_cursor.execute("SELECT vote_hash FROM immutable_votes")
        ledger_votes = set([row[0] for row in ldr_cursor.fetchall()])
        ldr_conn.close()
        
        # Rule 1: A vote exists in ledger but NOT in source (Tampering: Deletion from source)
        for v in ledger_votes:
            if v not in source_votes:
                log_anomaly("MISSING_VOTE", "Vote found in immutable ledger but deleted from main database", v)
                
        print("Audit run complete. No anomalies detected." if ledger_votes.issubset(source_votes) else "Audit run complete. Anomalies logged.")
    except Exception as e:
        print(f"Audit failed: {e}")

if __name__ == "__main__":
    print("Starting Compliance Audit Service...")
    init_audit_db()
    while True:
        run_audit()
        time.sleep(30)
