from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import Base, engine, get_db

from app.models import (
    Voter,
    Candidate,
    Vote
)

from app.schemas import (
    RegisterSchema,
    VoteSchema
)

import random
import string
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from jose import jwt, JWTError
from pydantic import BaseModel


load_dotenv()

app = FastAPI()


security = HTTPBearer(auto_error=False)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "Admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin")
ADMIN_JWT_SECRET = os.getenv("ADMIN_JWT_SECRET", "hcverify-admin-secret")
ADMIN_TOKEN_ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRES_HOURS = 8


class AdminLoginSchema(BaseModel):

    username: str

    password: str


def create_admin_token():

    expire = datetime.utcnow() + timedelta(hours=ADMIN_TOKEN_EXPIRES_HOURS)

    payload = {
        "sub": ADMIN_USERNAME,
        "role": "admin",
        "exp": expire
    }

    return jwt.encode(
        payload,
        ADMIN_JWT_SECRET,
        algorithm=ADMIN_TOKEN_ALGORITHM
    )


def require_admin(

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    if not ADMIN_USERNAME or not ADMIN_PASSWORD:

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin credentials not configured"
        )

    if not credentials:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    try:

        payload = jwt.decode(
            credentials.credentials,
            ADMIN_JWT_SECRET,
            algorithms=[ADMIN_TOKEN_ALGORITHM]
        )

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    if payload.get("sub") != ADMIN_USERNAME or payload.get("role") != "admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return payload


# =====================================
# CORS
# =====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================
# STARTUP
# =====================================

@app.on_event("startup")
async def startup():

    async with engine.begin() as conn:

        await conn.run_sync(
            Base.metadata.create_all
        )

    async for db in get_db():

        result = await db.execute(
            select(Candidate)
        )

        existing = result.scalars().all()

        if len(existing) == 0:

            candidates = [

                Candidate(
                    name="Tariq Mehmood",
                    party="National Progress Alliance",
                    symbol="⭐",
                    constituency="Lahore",
                    votes=0
                ),

                Candidate(
                    name="Ayesha Siddiqui",
                    party="Pakistan Democratic Front",
                    symbol="🌙",
                    constituency="Lahore",
                    votes=0
                ),

                Candidate(
                    name="Zara Hussain",
                    party="Independent",
                    symbol="🌿",
                    constituency="Lahore",
                    votes=0
                ),

                Candidate(
                    name="Khalid Nawaz",
                    party="United Lawyers Party",
                    symbol="⚖️",
                    constituency="Lahore",
                    votes=0
                )

            ]

            db.add_all(candidates)

            await db.commit()

        break


# =====================================
# ROOT
# =====================================

@app.get("/")
async def root():

    return {
        "message": "HC Verify Backend Running"
    }


# =====================================
# ADMIN LOGIN
# =====================================

@app.post("/admin/login")
async def admin_login(credentials: AdminLoginSchema):

    if (
        credentials.username != ADMIN_USERNAME
        or credentials.password != ADMIN_PASSWORD
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    token = create_admin_token()

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =====================================
# REGISTER VOTER
# =====================================

@app.post("/register")
async def register_voter(

    voter: RegisterSchema,

    db: AsyncSession = Depends(get_db)

):

    # Prevent duplicate CNIC or identical identity data

    existing = await db.execute(

        select(Voter).where(
            Voter.cnic == voter.cnic
        )
    )

    existing_voter = existing.scalars().first()

    if existing_voter:

        if existing_voter.has_voted:

            return {

                "success": False,

                "message": "You have already voted"
            }

        return {

            "success": True,

            "message": "Voter ID recovered",

            "voter_id": existing_voter.voter_id
        }

    duplicate_identity = await db.execute(

        select(Voter).where(
            Voter.full_name == voter.full_name,
            Voter.phone == voter.phone,
            Voter.constituency == voter.constituency
        )
    )

    duplicate_voter = duplicate_identity.scalars().first()

    if duplicate_voter:

        if duplicate_voter.has_voted:

            return {

                "success": False,

                "message": "You have already voted"
            }

        return {

            "success": True,

            "message": "Voter ID recovered",

            "voter_id": duplicate_voter.voter_id
        }

    # Generate voter ID

    voter_id = "HC-" + ''.join(

        random.choices(
            string.ascii_uppercase + string.digits,
            k=6
        )
    )

    # Create voter

    new_voter = Voter(

        voter_id=voter_id,

        full_name=voter.full_name,

        cnic=voter.cnic,

        phone=voter.phone,

        constituency=voter.constituency
    )

    db.add(new_voter)

    await db.commit()

    return {

        "success": True,

        "message": "Voter registered successfully",

        "voter_id": voter_id
    }


# =====================================
# GET ALL VOTERS
# =====================================

@app.get("/voters")
async def get_voters(

    db: AsyncSession = Depends(get_db)

):

    result = await db.execute(
        select(Voter)
    )

    return result.scalars().all()


# =====================================
# AUTHENTICATE VOTER
# =====================================

@app.get("/authenticate/{voter_id}")
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


# =====================================
# GET CANDIDATES
# =====================================

@app.get("/candidates")
async def get_candidates(

    db: AsyncSession = Depends(get_db)

):

    result = await db.execute(
        select(Candidate)
    )

    return result.scalars().all()


# =====================================
# CAST VOTE
# =====================================

@app.post("/vote")
async def cast_vote(

    vote: VoteSchema,

    db: AsyncSession = Depends(get_db)

):

    # Find voter

    voter_result = await db.execute(

        select(Voter).where(
            Voter.voter_id == vote.voter_id
        )
    )

    voter = voter_result.scalars().first()

    if not voter:

        return {

            "success": False,

            "message": "Invalid voter"
        }

    # Prevent double voting

    if voter.has_voted:

        return {

            "success": False,

            "message": "Vote already cast"
        }

    # Find candidate

    candidate_result = await db.execute(

        select(Candidate).where(
            Candidate.id == vote.candidate_id
        )
    )

    candidate = candidate_result.scalars().first()

    if not candidate:

        return {

            "success": False,

            "message": "Candidate not found"
        }

    # Generate receipt

    receipt_code = "RCPT-" + ''.join(

        random.choices(
            string.ascii_uppercase + string.digits,
            k=8
        )
    )

    # Generate fake blockchain hash

    blockchain_hash = "0x" + ''.join(

        random.choices(
            "ABCDEF0123456789",
            k=32
        )
    )

    # Save vote

    new_vote = Vote(

        voter_id=voter.id,

        candidate_id=candidate.id,

        receipt_code=receipt_code,

        blockchain_hash=blockchain_hash
    )

    db.add(new_vote)

    # Update totals

    candidate.votes += 1

    voter.has_voted = True

    await db.commit()

    return {

        "success": True,

        "message": "Vote cast successfully",

        # Visible ONLY immediately
        # after voting

        "candidate_name": candidate.name,

        "candidate_symbol": candidate.symbol,

        "receipt_code": receipt_code,

        "blockchain_hash": blockchain_hash
    }


# =====================================
# VERIFY RECEIPT
# =====================================

@app.get("/verify/{receipt_code}")
async def verify_vote(

    receipt_code: str,

    db: AsyncSession = Depends(get_db)

):

    result = await db.execute(

        select(Vote).where(
            Vote.receipt_code == receipt_code
        )
    )

    vote = result.scalars().first()

    if not vote:

        return {

            "success": False,

            "message": "Receipt not found"
        }

    # SECRET BALLOT:
    # Candidate intentionally hidden

    return {

        "success": True,

        "message": "Vote verified successfully",

        "receipt_code": vote.receipt_code,

        "blockchain_hash": vote.blockchain_hash
    }


# =====================================
# RESULTS
# =====================================

@app.get("/results")
async def results(

    db: AsyncSession = Depends(get_db),

    _: dict = Depends(require_admin)

):

    result = await db.execute(
        select(Candidate)
    )

    return result.scalars().all()