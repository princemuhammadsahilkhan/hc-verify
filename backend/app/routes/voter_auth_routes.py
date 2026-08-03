from fastapi.security import HTTPAuthorizationCredentials
import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.database import get_db
from app.models import Voter, Candidate, Vote, District, AuditLog
from app.schemas import RegisterSchema, AuthRegisterSchema, AuthUpdateSchema, LoginSchema, CandidateCreateSchema, VoteSchema
from app.dependencies import require_admin, security, get_current_voter
from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token
from app.face_service import extract_embedding, match_faces
from app.security_middleware import login_limiter, vote_limiter, register_limiter, audit, validate_registration
import uuid
from datetime import datetime, timezone
import hashlib
import random
import string
def calculate_registration_hash(voter_id: str, cnic: str, full_name: str) -> str:
    return hashlib.sha256(f"{voter_id}{cnic}{full_name}".encode()).hexdigest()

def calculate_vote_hash(voter_id: int, candidate_id: int, receipt_code: str) -> str:
    return hashlib.sha256(f"{voter_id}{candidate_id}{receipt_code}".encode()).hexdigest()

router = APIRouter()

@router.post("/auth/register")
async def auth_register(

    voter: AuthRegisterSchema,

    db: AsyncSession = Depends(get_db)

):
    existing_email = await db.execute(
        select(Voter).where(Voter.email == voter.email)
    )

    if existing_email.scalars().first():

        raise HTTPException(status_code=400, detail="Email already exists")

    voter_id = uuid.uuid4()

    new_voter = Voter(

        voter_id=voter_id,

        full_name=voter.full_name,

        email=voter.email,

        password=hash_password(voter.password),

        cnic="AUTH-" + ''.join(

            random.choices(

                string.ascii_uppercase + string.digits,

                k=10

            )

        ),

        district=voter.district,

        phone=voter.phone or "",

        constituency=voter.constituency or voter.district,

    )

    new_voter.registration_hash = calculate_registration_hash(
        new_voter.voter_id,
        new_voter.cnic,
        new_voter.full_name
    )

    db.add(new_voter)

    await db.commit()

    return {

        "success": True,

        "message": "User registered successfully",

    }



@router.post("/auth/login")
async def auth_login(

    user: LoginSchema,

    db: AsyncSession = Depends(get_db)

):
    result = await db.execute(
        select(Voter).where(
            (Voter.membership_type == user.email) | (Voter.bar_number == user.email)
        )
    )

    voter = result.scalars().first()

    if not voter or not voter.password:

        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(user.password, voter.password):

        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_access_token(
        data={
            "sub": voter.email,
            "role": "voter",
            "voter_id": str(voter.voter_id),
        }
    )

    return {

        "access_token": token,

        "token_type": "bearer"

    }



@router.get("/auth/me")
async def auth_me(

    token_data: dict = Depends(get_current_voter),

    db: AsyncSession = Depends(get_db)

):

    voter_id = token_data.get("voter_id")

    result = await db.execute(
        select(Voter).where(Voter.voter_id == voter_id)
    )

    voter = result.scalars().first()

    if not voter:

        raise HTTPException(status_code=404, detail="Voter not found")

    return {

        "id": voter.id,

        "voter_id": voter.voter_id,

        "full_name": voter.full_name,

        "email": voter.email,

        "cnic": voter.cnic,

        "district": voter.district,

        "is_verified": voter.is_verified,

        "has_voted": voter.has_voted,

        "created_at": voter.created_at,

    }



@router.put("/auth/me")
async def update_auth_me(

    payload: AuthUpdateSchema,

    token_data: dict = Depends(get_current_voter),

    db: AsyncSession = Depends(get_db)

):
    voter_id = token_data.get("voter_id")

    result = await db.execute(
        select(Voter).where(Voter.voter_id == voter_id)
    )

    voter = result.scalars().first()

    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")

    if payload.email and payload.email != voter.email:
        existing_email = await db.execute(
            select(Voter).where(Voter.email == payload.email)
        )
        if existing_email.scalars().first():
            raise HTTPException(status_code=400, detail="Email already exists")
        voter.email = payload.email

    if payload.full_name:
        voter.full_name = payload.full_name

    if payload.district:
        voter.district = payload.district

    if payload.password:
        voter.password = hash_password(payload.password)

    await db.commit()
    await db.refresh(voter)

    return {
        "success": True,
        "message": "Profile updated successfully",
        "voter": {
            "id": voter.id,
            "voter_id": voter.voter_id,
            "full_name": voter.full_name,
            "email": voter.email,
            "district": voter.district,
            "is_verified": voter.is_verified,
            "has_voted": voter.has_voted,
            "created_at": voter.created_at,
        },
    }



@router.get("/voters")
async def get_voters(

    db: AsyncSession = Depends(get_db)

):

    result = await db.execute(
        select(Voter)
    )

    return result.scalars().all()



@router.get("/authenticate/{voter_id}")
async def authenticate_voter(

    voter_id: str,

    db: AsyncSession = Depends(get_db)

):

    result = await db.execute(

        select(Voter).where(
            Voter.voter_id == voter_id
        )
    )

    voter = result.scalars().first()

    if not voter:

        return {

            "success": False,

            "message": "Invalid voter ID"
        }

    if voter.has_voted:

        return {

            "success": False,

            "message": "Vote already cast"
        }

    return {

        "success": True,

        "message": "Authentication successful",

        "voter": {

            "name": voter.full_name,

            "constituency": voter.constituency
        }
    }



