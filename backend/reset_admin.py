#!/usr/bin/env python3
"""
reset_admin.py  —  CLI Emergency Admin Reset

Run this directly on the server when locked out:

    python reset_admin.py

It will:
  1. Ask for a new username and password
  2. Write them to .env immediately
  3. Rotate the recovery key
  4. Print confirmation

No server restart needed (new credentials load on next login attempt).
"""

import os
import sys
import getpass
from pathlib import Path

# Make sure we can import from app/
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv, set_key
load_dotenv()

from app.admin_recovery import rotate_recovery_key

ENV_FILE = ".env"

def main():
    print("\n" + "=" * 50)
    print("  HC-VERIFY  EMERGENCY ADMIN RESET")
    print("=" * 50)
    print("\nThis will overwrite admin credentials in .env\n")

    # Confirm intent
    confirm = input("Type YES to continue: ").strip()
    if confirm != "YES":
        print("Aborted.")
        sys.exit(0)

    # New credentials
    new_username = input("\nNew admin username: ").strip()
    if not new_username:
        print("Username cannot be empty. Aborted.")
        sys.exit(1)

    new_password = getpass.getpass("New admin password: ").strip()
    if len(new_password) < 8:
        print("Password must be at least 8 characters. Aborted.")
        sys.exit(1)

    confirm_password = getpass.getpass("Confirm password: ").strip()
    if new_password != confirm_password:
        print("Passwords do not match. Aborted.")
        sys.exit(1)

    # Write to .env
    set_key(ENV_FILE, "ADMIN_USERNAME", new_username)
    set_key(ENV_FILE, "ADMIN_PASSWORD", new_password)
    os.environ["ADMIN_USERNAME"] = new_username
    os.environ["ADMIN_PASSWORD"] = new_password

    # Rotate recovery key so old key is invalidated
    new_key = rotate_recovery_key()

    print("\n✓ Admin credentials updated in .env")
    print(f"✓ New recovery key generated → recovery_key.txt")
    print("\n⚠  Store recovery_key.txt OFFLINE immediately.")
    print("⚠  Restart the backend server for changes to take effect.\n")


if __name__ == "__main__":
    main()
