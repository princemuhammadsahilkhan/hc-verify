from fastapi.security import HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends
from app.utils.security import require_admin, enforce_role

router = APIRouter(prefix="/admin/commissioner", tags=["Admin Commissioner"])

# Place Commissioner-specific endpoints here.
