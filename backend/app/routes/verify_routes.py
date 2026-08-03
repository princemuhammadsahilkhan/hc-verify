from fastapi.security import HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends
from app.utils.security import require_admin

router = APIRouter(prefix="/admin/verify", tags=["Admin Verify"])

@router.get("/")
async def verify_root(admin_user: dict = Depends(require_admin)):
    return {"status": "ok"}
