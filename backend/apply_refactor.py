import os
import re

with open('main.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def get_block(start_line_idx):
    block = []
    i = start_line_idx
    while i < len(lines) and lines[i].startswith('@'):
        block.append(lines[i])
        i += 1
    while i < len(lines) and (lines[i].startswith('async def') or lines[i].startswith('def ')):
        block.append(lines[i])
        i += 1
    while i < len(lines) and not lines[i-1].strip().endswith(':'):
        block.append(lines[i])
        i += 1
    while i < len(lines):
        if not lines[i].strip():
            block.append(lines[i])
            i += 1
            continue
        if not lines[i].startswith(' ') and not lines[i].startswith('\t'):
            break
        block.append(lines[i])
        i += 1
    return ''.join(block).replace('@app.', '@router.'), start_line_idx, i - 1

targets = {
    'voter_auth_routes.py': [
        '@app.post("/auth/register")',
        '@app.post("/auth/login")',
        '@app.get("/auth/me")',
        '@app.put("/auth/me")',
        '@app.get("/voters")',
        '@app.get("/authenticate/{voter_id}")'
    ],
    'candidate_routes.py': [
        '@app.get("/candidates")',
        '@app.post("/candidates")',
        '@app.put("/candidates/{id}")',
        '@app.delete("/candidates/{id}")'
    ],
    'vote_routes.py': [
        '@app.post("/vote")'
    ],
    'results_routes.py': [
        '@app.get("/results")'
    ]
}

blocks = {}
to_remove_ranges = []

for file_name, patterns in targets.items():
    blocks[file_name] = []
    for p in patterns:
        for i, line in enumerate(lines):
            if p in line:
                block, start, end = get_block(i)
                blocks[file_name].append(block)
                to_remove_ranges.append((start, end))
                break

to_remove_ranges.append((73, 79))  # lines 74-80 (0-indexed)
to_remove_ranges.append((139, 243)) # lines 140-244

def is_removed(idx):
    for r in to_remove_ranges:
        if r[0] <= idx <= r[1]:
            return True
    return False

new_main_lines = []
for i, line in enumerate(lines):
    if not is_removed(i):
        new_main_lines.append(line)
        if line.strip() == "load_dotenv()":
            new_main_lines.append("from app.dependencies import require_admin, get_current_voter, create_admin_token, ADMIN_USERNAME, ADMIN_PASSWORD\n")
            new_main_lines.append("from app.routes.voter_auth_routes import router as voter_auth_router\n")
            new_main_lines.append("from app.routes.candidate_routes import router as candidate_router\n")
            new_main_lines.append("from app.routes.vote_routes import router as vote_router\n")
            new_main_lines.append("from app.routes.results_routes import router as results_router\n")
        if "app.include_router(election_router" in line:
            new_main_lines.insert(-1, "app.include_router(voter_auth_router)\n")
            new_main_lines.insert(-1, "app.include_router(candidate_router)\n")
            new_main_lines.insert(-1, "app.include_router(vote_router)\n")
            new_main_lines.insert(-1, "app.include_router(results_router)\n")

with open('main_new.py', 'w', encoding='utf-8') as f:
    f.writelines(new_main_lines)

common_imports = """import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.database import get_db
from app.models import Voter, Candidate, Vote
from app.schemas import RegisterSchema, AuthRegisterSchema, AuthUpdateSchema, LoginSchema, CandidateCreateSchema, VoteSchema
from app.dependencies import require_admin, get_current_voter
from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.face_service import extract_embedding, match_faces
from app.security_middleware import login_limiter, vote_limiter, register_limiter, audit, validate_registration
import uuid
from datetime import datetime, timezone
import hashlib

def calculate_registration_hash(voter_id: str, cnic: str, full_name: str) -> str:
    return hashlib.sha256(f"{voter_id}{cnic}{full_name}".encode()).hexdigest()

def calculate_vote_hash(voter_id: int, candidate_id: int, receipt_code: str) -> str:
    return hashlib.sha256(f"{voter_id}{candidate_id}{receipt_code}".encode()).hexdigest()

router = APIRouter()

"""

os.makedirs('app/routes', exist_ok=True)
for file_name, file_blocks in blocks.items():
    with open(f'app/routes/{file_name}', 'w', encoding='utf-8') as f:
        f.write(common_imports)
        for b in file_blocks:
            f.write(b)
            f.write('\n')

print("Refactor scripts prepared.")
