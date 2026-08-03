from fastapi.security import HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends
from app.utils.security import require_admin, enforce_role

router = APIRouter(prefix="/admin/superadmin", tags=["Admin SuperAdmin"])

@router.get("/")
async def superadmin_root(admin_user: dict = Depends(require_admin)):
    enforce_role(admin_user, ["super_admin"])
    return {"status": "ok", "role": "super_admin"}
