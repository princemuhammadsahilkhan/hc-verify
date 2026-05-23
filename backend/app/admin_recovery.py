"""
admin_recovery.py

Three-layer admin recovery system:
  1. Recovery key  — generated once at startup, saved to RECOVERY_KEY_FILE
  2. Email reset   — sends a time-limited token to ADMIN_EMAIL
  3. CLI reset     — run reset_admin.py directly on the server

Nothing here changes existing login logic.
"""

import os
import secrets
import hashlib
import smtplib
import json
from datetime import datetime, timedelta
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv, set_key

load_dotenv()

# ── Config ────────────────────────────────────────────────────
RECOVERY_KEY_FILE = os.getenv("RECOVERY_KEY_FILE", "recovery_key.txt")
ADMIN_EMAIL       = os.getenv("ADMIN_EMAIL", "")
SMTP_HOST         = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT         = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER         = os.getenv("SMTP_USER", "")
SMTP_PASS         = os.getenv("SMTP_PASS", "")
ENV_FILE          = ".env"

# In-memory store for active email reset tokens
# { token_hash: { expires: datetime, used: bool } }
_reset_tokens: dict = {}


# ─────────────────────────────────────────────────────────────
# 1. RECOVERY KEY
# Generated once on startup. Admin stores this file offline.
# Used to bypass login and reset credentials.
# ─────────────────────────────────────────────────────────────

def generate_recovery_key() -> str:
    """Generate a new recovery key and save its hash to file."""
    key = "RCVR-" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(key.encode()).hexdigest()

    Path(RECOVERY_KEY_FILE).write_text(
        f"HC-VERIFY ADMIN RECOVERY KEY\n"
        f"Generated: {datetime.utcnow().isoformat()}\n\n"
        f"KEY: {key}\n\n"
        f"Keep this file OFFLINE and SECURE.\n"
        f"Use it at /admin/recover endpoint if locked out.\n"
    )

    # Store only the hash in env (never the raw key)
    set_key(ENV_FILE, "RECOVERY_KEY_HASH", key_hash)

    return key


def ensure_recovery_key_exists():
    """Called at startup — creates key only if none exists."""
    existing_hash = os.getenv("RECOVERY_KEY_HASH", "")
    if not existing_hash or not Path(RECOVERY_KEY_FILE).exists():
        key = generate_recovery_key()
        print(f"\n[RECOVERY] New recovery key generated → {RECOVERY_KEY_FILE}")
        print(f"[RECOVERY] STORE THIS FILE OFFLINE AND SECURELY.\n")
        return key
    return None


def verify_recovery_key(key: str) -> bool:
    """Check a submitted recovery key against stored hash."""
    stored_hash = os.getenv("RECOVERY_KEY_HASH", "")
    if not stored_hash:
        return False
    submitted_hash = hashlib.sha256(key.encode()).hexdigest()
    return secrets.compare_digest(submitted_hash, stored_hash)


def rotate_recovery_key():
    """Invalidate old key and generate a fresh one. Call after use."""
    return generate_recovery_key()


# ─────────────────────────────────────────────────────────────
# 2. EMAIL RESET
# Sends a short-lived token to the configured ADMIN_EMAIL.
# Token valid for 15 minutes, single use.
# ─────────────────────────────────────────────────────────────

def request_email_reset() -> dict:
    """Generate a reset token and email it to ADMIN_EMAIL."""
    if not ADMIN_EMAIL:
        return {"success": False, "message": "ADMIN_EMAIL not configured in .env"}
    if not SMTP_USER or not SMTP_PASS:
        return {"success": False, "message": "SMTP credentials not configured in .env"}

    token      = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires    = datetime.utcnow() + timedelta(minutes=15)

    _reset_tokens[token_hash] = {"expires": expires, "used": False}

    # Send email
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "HC-Verify Admin Password Reset"
        msg["From"]    = SMTP_USER
        msg["To"]      = ADMIN_EMAIL

        body = (
            f"HC-Verify Admin Recovery\n\n"
            f"A password reset was requested for the admin account.\n\n"
            f"Your reset token (valid 15 minutes):\n\n"
            f"  {token}\n\n"
            f"POST to /admin/reset-password with:\n"
            f"  {{ \"reset_token\": \"{token}\", \"new_password\": \"your-new-password\" }}\n\n"
            f"If you did not request this, your account may be compromised.\n"
            f"Change credentials immediately.\n"
        )

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, ADMIN_EMAIL, msg.as_string())

        return {"success": True, "message": f"Reset token sent to {ADMIN_EMAIL}"}

    except Exception as e:
        print(f"[RECOVERY] Email send failed: {e}")
        return {"success": False, "message": "Failed to send email. Check SMTP config."}


def verify_reset_token(token: str) -> bool:
    """Validate an email reset token."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    entry = _reset_tokens.get(token_hash)

    if not entry:
        return False
    if entry["used"]:
        return False
    if datetime.utcnow() > entry["expires"]:
        return False

    return True


def consume_reset_token(token: str):
    """Mark token as used so it can't be reused."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if token_hash in _reset_tokens:
        _reset_tokens[token_hash]["used"] = True


# ─────────────────────────────────────────────────────────────
# 3. APPLY NEW CREDENTIALS
# Updates .env file with new username/password.
# Used by both recovery key and email reset paths.
# ─────────────────────────────────────────────────────────────

def apply_new_credentials(new_username: str = None, new_password: str = None):
    """Write new admin credentials to .env and reload env vars."""
    if new_username:
        set_key(ENV_FILE, "ADMIN_USERNAME", new_username)
        os.environ["ADMIN_USERNAME"] = new_username

    if new_password:
        set_key(ENV_FILE, "ADMIN_PASSWORD", new_password)
        os.environ["ADMIN_PASSWORD"] = new_password

    print(f"[RECOVERY] Admin credentials updated successfully.")
