from fastapi.security import HTTPAuthorizationCredentials
from fastapi import APIRouter, Depends
from app.utils.security import require_admin, enforce_role

router = APIRouter(prefix="/admin/support", tags=["Admin Support"])

# Place Support-specific endpoints here.
