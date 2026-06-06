"""
security_middleware.py

Implements:
- Rate limiting (in-memory, per IP)
- Account lockout after 5 failed attempts
- Input validation (CNIC, phone)
- Audit logging helper
"""

import time
import re
from collections import defaultdict
from datetime import datetime
from fastapi import HTTPException, Request, status

# ─────────────────────────────────────────────────────────────
# RATE LIMITER
# ─────────────────────────────────────────────────────────────

class RateLimiter:
    def __init__(self, max_calls: int, period: int):
        self.max_calls = max_calls
        self.period    = period          # seconds
        self._calls    = defaultdict(list)

    def check(self, key: str):
        now   = time.time()
        calls = [t for t in self._calls[key] if now - t < self.period]
        calls.append(now)
        self._calls[key] = calls

        if len(calls) > self.max_calls:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Try again in {self.period} seconds."
            )

# One instance per endpoint type
login_limiter   = RateLimiter(max_calls=5,  period=60)   # 5 per minute
vote_limiter    = RateLimiter(max_calls=3,  period=60)   # 3 per minute
register_limiter = RateLimiter(max_calls=5, period=60)   # 5 per minute


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


# ─────────────────────────────────────────────────────────────
# ACCOUNT LOCKOUT
# ─────────────────────────────────────────────────────────────

class AccountLockout:
    def __init__(self, max_attempts: int = 5, lockout_seconds: int = 300):
        self.max_attempts      = max_attempts
        self.lockout_seconds   = lockout_seconds
        self._attempts         = defaultdict(int)
        self._locked_until     = {}

    def record_failure(self, key: str):
        self._attempts[key] += 1
        if self._attempts[key] >= self.max_attempts:
            self._locked_until[key] = time.time() + self.lockout_seconds
            self._attempts[key]     = 0

    def record_success(self, key: str):
        self._attempts.pop(key, None)
        self._locked_until.pop(key, None)

    def check(self, key: str):
        locked_until = self._locked_until.get(key)
        if locked_until and time.time() < locked_until:
            remaining = int(locked_until - time.time())
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked. Try again in {remaining} seconds."
            )

admin_lockout = AccountLockout(max_attempts=5, lockout_seconds=300)


# ─────────────────────────────────────────────────────────────
# INPUT VALIDATION
# ─────────────────────────────────────────────────────────────

def validate_cnic(cnic: str):
    """CNIC must be in format 00000-0000000-0"""
    clean = cnic.replace("-", "")
    if not re.fullmatch(r"\d{13}", clean):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid CNIC format. Use 00000-0000000-0"
        )

def validate_phone(phone: str):
    """Phone must be 11 digits starting with 03"""
    clean = re.sub(r"\D", "", phone)
    if not re.fullmatch(r"03\d{9}", clean):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid phone number. Use 03XXXXXXXXX format."
        )

def validate_name(name: str):
    if not name or len(name.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Full name must be at least 3 characters."
        )

def validate_registration(data):
    validate_name(data.full_name)
    validate_cnic(data.cnic)
    validate_phone(data.phone)


# ─────────────────────────────────────────────────────────────
# AUDIT LOG HELPER
# ─────────────────────────────────────────────────────────────

from app.models import AuditLog

async def audit(db, action: str, details: str, severity: str = "info"):
    try:
        log = AuditLog(action=action, details=details, severity=severity, timestamp=datetime.utcnow())
        db.add(log)
        await db.commit()
    except Exception as e:
        print(f"[Audit] Failed to log: {e}")
