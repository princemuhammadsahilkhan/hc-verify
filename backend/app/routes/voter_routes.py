from fastapi.security import HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends
from app.utils.security import require_admin, enforce_role

router = APIRouter(prefix="/admin/voter", tags=["Admin Voter"])

@router.get("/")
async def voter_root(admin_user: dict = Depends(require_admin)):
    # Voters self-endpoints or administrative read
    enforce_role(admin_user, ["super_admin", "admin", "voter"])
    return {"status": "ok"}
