import os
import time
import sqlite3
import hashlib
from datetime import datetime

# In a real environment, this would be a Kafka consumer or Debezium CDC pipeline.
# For this architecture, we poll the source DB (mounted read-only) and append to ledger DB.

SOURCE_DB = "/app/data/hc_verify.db"
LEDGER_DB = "/app/ledger/ledger.db"

def init_ledger():
    conn = sqlite3.connect(LEDGER_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS immutable_votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_vote_id INTEGER UNIQUE,
            voter_id INTEGER,
            candidate_id INTEGER,
            receipt_code TEXT,
            vote_hash TEXT,
            timestamp DATETIME,
            ledger_hash TEXT
        )
    ''')
    conn.commit()
    conn.close()

def sync_votes():
    if not os.path.exists(SOURCE_DB):
        print("Source DB not found, waiting...")
        return

    # Connect to source (Read Only)
    src_conn = sqlite3.connect(f"file:{SOURCE_DB}?mode=ro", uri=True)
    src_cursor = src_conn.cursor()
    
    # Connect to ledger (Append Only)
    ldr_conn = sqlite3.connect(LEDGER_DB)
    ldr_cursor = ldr_conn.cursor()
    
    # Get max synced ID
    ldr_cursor.execute("SELECT MAX(original_vote_id) FROM immutable_votes")
    row = ldr_cursor.fetchone()
    last_id = row[0] if row[0] is not None else 0
    
    # Fetch new votes
    try:
        src_cursor.execute("SELECT id, voter_id, candidate_id, receipt_code, vote_hash, timestamp FROM votes WHERE id > ?", (last_id,))
        new_votes = src_cursor.fetchall()
        
        for vote in new_votes:
            v_id, voter_id, candidate_id, receipt_code, vote_hash, ts = vote
            
            # Calculate Ledger Hash to prove append-only sequence
            ldr_cursor.execute("SELECT ledger_hash FROM immutable_votes ORDER BY id DESC LIMIT 1")
            prev = ldr_cursor.fetchone()
            prev_hash = prev[0] if prev else "0"
            
            payload = f"{prev_hash}{v_id}{voter_id}{candidate_id}{receipt_code}{vote_hash}".encode()
            ledger_hash = hashlib.sha256(payload).hexdigest()
            
            ldr_cursor.execute('''
                INSERT INTO immutable_votes (original_vote_id, voter_id, candidate_id, receipt_code, vote_hash, timestamp, ledger_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (v_id, voter_id, candidate_id, receipt_code, vote_hash, ts, ledger_hash))
            
            print(f"Synced vote {v_id} to Immutable Ledger. Hash: {ledger_hash}")
            
        ldr_conn.commit()
    except Exception as e:
        print("Error syncing votes (DB might be locked or uninitialized):", e)
    finally:
        src_conn.close()
        ldr_conn.close()

if __name__ == "__main__":
    print("Starting Ledger Sync Service...")
    init_ledger()
    while True:
        sync_votes()
        time.sleep(10)
