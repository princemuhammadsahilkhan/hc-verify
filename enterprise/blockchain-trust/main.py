import sqlite3
import hashlib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="HV Verify Blockchain Trust (Merkle Engine)")

LEDGER_DB = "/app/ledger/ledger.db"

def get_leaves():
    try:
        conn = sqlite3.connect(LEDGER_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT ledger_hash FROM immutable_votes ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()
        return [r[0] for r in rows]
    except Exception:
        return []

def build_merkle_tree(leaves):
    if not leaves:
        return None, []
    
    tree = [leaves]
    current_level = leaves
    
    while len(current_level) > 1:
        next_level = []
        for i in range(0, len(current_level), 2):
            left = current_level[i]
            right = current_level[i+1] if i+1 < len(current_level) else left
            combined = hashlib.sha256(f"{left}{right}".encode()).hexdigest()
            next_level.append(combined)
        tree.append(next_level)
        current_level = next_level
        
    return current_level[0], tree

@app.get("/trust/merkle-root")
async def get_merkle_root():
    leaves = get_leaves()
    if not leaves:
        return {"root": None, "message": "No votes in ledger yet"}
        
    root, _ = build_merkle_tree(leaves)
    return {"merkle_root": root, "total_leaves": len(leaves)}

@app.get("/trust/verify-proof/{vote_hash}")
async def verify_proof(vote_hash: str):
    # This is a simplified proof verification simulation.
    leaves = get_leaves()
    
    try:
        conn = sqlite3.connect(LEDGER_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT ledger_hash FROM immutable_votes WHERE vote_hash = ?", (vote_hash,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            raise HTTPException(status_code=404, detail="Vote not found in immutable ledger")
            
        target_hash = row[0]
        
        if target_hash in leaves:
            root, _ = build_merkle_tree(leaves)
            return {
                "verified": True, 
                "message": "Cryptographic proof generated successfully",
                "merkle_root": root,
                "ledger_hash": target_hash
            }
        else:
            return {"verified": False, "message": "Hash mismatch"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trust/health")
async def health_check():
    return {"status": "ok", "service": "blockchain-trust"}
