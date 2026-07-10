import sys

with open("backend/main.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
import_str = '''
from app.services.receipt_service import generate_vote_receipt
from app.services.verification_service import verify_voter_receipt
from app.services.blockchain_service import get_all_blocks
from app.services.district_sync_service import get_all_sync_logs
'''
if "generate_vote_receipt" not in content:
    content = content.replace("app = FastAPI()", import_str + "\napp = FastAPI()")

# 2. Vote intercept
vote_str = '''
    await db.commit()
    await db.refresh(new_vote)
    
    # Layer 1 - Generate Paper Trail Receipt
    await generate_vote_receipt(
        db=db,
        vote_id=new_vote.id,
        district=voter.district,
        polling_station=voter.constituency
    )

    return {
'''
if "generate_vote_receipt(" not in content:
    content = content.replace("    await db.commit()\n\n    return {\n", vote_str)

# 3. POST verify-receipt
verify_str = '''
# =====================================
# VERIFY RECEIPT
# =====================================

class VerifyReceiptSchema(BaseModel):
    receipt_code: str

@app.post("/verify-receipt")
async def verify_receipt_endpoint(
    data: VerifyReceiptSchema,
    db: AsyncSession = Depends(get_db)
):
    result = await verify_voter_receipt(db, data.receipt_code)
    return result

@app.get("/verify/{receipt_code}")
'''
if "/verify-receipt" not in content:
    content = content.replace("# =====================================\n# VERIFY RECEIPT\n# =====================================\n\n@app.get(\"/verify/{receipt_code}\")\n", verify_str)

# 4. Admin Security Endpoints
admin_sec_str = '''
# =====================================
# ADMIN SECURITY ENDPOINTS
# =====================================

@app.get("/admin/security/blockchain")
async def get_admin_security_blockchain(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    blocks = await get_all_blocks(db)
    return {"success": True, "blocks": blocks}

@app.get("/admin/security/sync-logs")
async def get_admin_security_sync_logs(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    logs = await get_all_sync_logs(db)
    return {"success": True, "logs": logs}


# =====================================
# SYSTEM INTEGRITY
# =====================================
'''
if "/admin/security/blockchain" not in content:
    content = content.replace("# =====================================\n# SYSTEM INTEGRITY\n# =====================================\n", admin_sec_str)

with open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(content)

print("Restored main.py successfully")