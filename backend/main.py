from fastapi import FastAPI, Depends, HTTPException, status, Request
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

from app.face_service import extract_embedding, match_faces
from app.security_middleware import (
    login_limiter, vote_limiter, register_limiter,
    get_client_ip, admin_lockout,
    validate_registration,
    audit,
)
from app.admin_recovery import (
    ensure_recovery_key_exists,
    verify_recovery_key,
    rotate_recovery_key,
    request_email_reset,
    verify_reset_token,
    consume_reset_token,
    apply_new_credentials,
)

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


class RecoveryKeySchema(BaseModel):
    recovery_key: str
    new_username: str
    new_password: str


class EmailResetSchema(BaseModel):
    reset_token: str
    new_password: str


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

    ensure_recovery_key_exists()


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
async def admin_login(credentials: AdminLoginSchema, request: Request):

    ip = get_client_ip(request)
    login_limiter.check(ip)
    admin_lockout.check("admin")

    if (
        credentials.username != ADMIN_USERNAME
        or credentials.password != ADMIN_PASSWORD
    ):
        admin_lockout.record_failure("admin")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    admin_lockout.record_success("admin")
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
    request: Request,
    db: AsyncSession = Depends(get_db)

):
    vote_limiter.check(get_client_ip(request))

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

# =====================================
# RECOVERY METHOD 1 — Recovery Key
# POST /admin/recover
# Body: { recovery_key, new_username, new_password }
# =====================================

@app.post("/admin/recover")
async def recover_with_key(data: RecoveryKeySchema):

    if not verify_recovery_key(data.recovery_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired recovery key"
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    apply_new_credentials(
        new_username=data.new_username,
        new_password=data.new_password
    )

    # Rotate key so it can't be reused
    rotate_recovery_key()

    return {
        "success": True,
        "message": "Admin credentials reset. Recovery key has been rotated — save the new recovery_key.txt"
    }


# =====================================
# RECOVERY METHOD 2a — Request Email Reset
# POST /admin/request-reset
# (no body — sends token to ADMIN_EMAIL in .env)
# =====================================

@app.post("/admin/request-reset")
async def request_reset():

    result = request_email_reset()

    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=result["message"]
        )

    return result


# =====================================
# RECOVERY METHOD 2b — Apply Email Reset
# POST /admin/reset-password
# Body: { reset_token, new_password }
# =====================================

@app.post("/admin/reset-password")
async def reset_password(data: EmailResetSchema):

    if not verify_reset_token(data.reset_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or already-used reset token"
        )

    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    consume_reset_token(data.reset_token)

    apply_new_credentials(new_password=data.new_password)

    return {
        "success": True,
        "message": "Admin password reset successfully"
    }


# =====================================
# FACE REGISTRATION
# POST /register-face
# Called after liveness verification completes
# Body: { voter_id, face_image }  (face_image = base64)
# =====================================

class FaceRegisterSchema(BaseModel):
    voter_id: str
    face_image: str  # base64 encoded image

@app.post("/register-face")
async def register_face(
    data: FaceRegisterSchema,
    db: AsyncSession = Depends(get_db)
):
    # Find voter
    result = await db.execute(
        select(Voter).where(Voter.voter_id == data.voter_id)
    )
    voter = result.scalars().first()

    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")

    # Extract face embedding
    face_result = extract_embedding(data.face_image)

    if not face_result["success"]:
        raise HTTPException(
            status_code=400,
            detail=face_result["message"]
        )

    import json
    voter.face_embedding = json.dumps(face_result["embedding"])
    await db.commit()

    return {
        "success": True,
        "message": "Face registered successfully"
    }


# =====================================
# FACE VERIFICATION AT VOTING TIME
# POST /verify-face
# Body: { voter_id, face_image }
# Returns: match=True → allow vote
#          match=False → mark pending
# =====================================

class FaceVerifySchema(BaseModel):
    voter_id: str
    face_image: str  # base64 encoded image

@app.post("/verify-face")
async def verify_face(
    data: FaceVerifySchema,
    db: AsyncSession = Depends(get_db)
):
    # Find voter
    result = await db.execute(
        select(Voter).where(Voter.voter_id == data.voter_id)
    )
    voter = result.scalars().first()

    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")

    # No face registered — allow but flag
    if not voter.face_embedding:
        return {
            "success": True,
            "match": True,
            "message": "No face registered — proceeding without verification"
        }

    # Compare faces
    match_result = match_faces(voter.face_embedding, data.face_image)

    if match_result["match"]:
        return {
            "success": True,
            "match": True,
            "similarity": match_result["similarity"],
            "message": "Identity verified"
        }

    # Face did not match — mark voter as pending
    voter.is_pending = True
    voter.pending_reason = (
        f"Face mismatch at voting time. "
        f"Similarity: {match_result['similarity']}"
    )
    await db.commit()

    return {
        "success": False,
        "match": False,
        "similarity": match_result["similarity"],
        "message": "Face did not match. Your vote has been flagged for manual review."
    }


# =====================================
# ADMIN — GET PENDING VOTERS
# GET /admin/pending-voters
# =====================================

@app.get("/admin/pending-voters")
async def get_pending_voters(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    result = await db.execute(
        select(Voter).where(Voter.is_pending == True)
    )
    voters = result.scalars().all()

    return [
        {
            "id": v.id,
            "voter_id": v.voter_id,
            "full_name": v.full_name,
            "cnic": v.cnic,
            "phone": v.phone,
            "constituency": v.constituency,
            "pending_reason": v.pending_reason,
            "has_voted": v.has_voted,
            "created_at": str(v.created_at),
        }
        for v in voters
    ]


# =====================================
# ADMIN — RESOLVE PENDING VOTER
# POST /admin/resolve-pending/{voter_id}
# Body: { action: "approve" | "manual_vote", candidate_id? }
# approve      → clear pending, allow normal voting
# manual_vote  → admin casts vote on their behalf
# =====================================

class ResolvePendingSchema(BaseModel):
    action: str          # "approve" or "manual_vote"
    candidate_id: int = None

@app.post("/admin/resolve-pending/{voter_id}")
async def resolve_pending(
    voter_id: str,
    data: ResolvePendingSchema,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    result = await db.execute(
        select(Voter).where(Voter.voter_id == voter_id)
    )
    voter = result.scalars().first()

    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")

    if data.action == "approve":
        # Clear pending — voter can now vote normally
        voter.is_pending = False
        voter.pending_reason = None
        await db.commit()
        return {"success": True, "message": "Voter approved for normal voting"}

    elif data.action == "manual_vote":
        if not data.candidate_id:
            raise HTTPException(status_code=400, detail="candidate_id required for manual_vote")

        if voter.has_voted:
            raise HTTPException(status_code=400, detail="Voter has already voted")

        # Find candidate
        cand_result = await db.execute(
            select(Candidate).where(Candidate.id == data.candidate_id)
        )
        candidate = cand_result.scalars().first()

        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        import random, string
        receipt_code = "RCPT-" + ''.join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        blockchain_hash = "0x" + ''.join(
            random.choices("ABCDEF0123456789", k=32)
        )

        new_vote = Vote(
            voter_id=voter.id,
            candidate_id=candidate.id,
            receipt_code=receipt_code,
            blockchain_hash=blockchain_hash
        )
        db.add(new_vote)

        candidate.votes += 1
        voter.has_voted = True
        voter.is_pending = False
        voter.pending_reason = None

        await db.commit()

        return {
            "success": True,
            "message": f"Manual vote cast for {candidate.name}",
            "receipt_code": receipt_code
        }

    else:
        raise HTTPException(status_code=400, detail="Invalid action")


# =====================================
# FACE DUPLICATE CHECK (before register)
# POST /check-face
# Returns: { exists: true/false, message }
# =====================================

class FaceCheckSchema(BaseModel):
    face_image: str

@app.post("/check-face")
async def check_face(
    data: FaceCheckSchema,
    db: AsyncSession = Depends(get_db)
):
    import json as _json
    # Extract embedding from submitted image
    result = extract_embedding(data.face_image)
    if not result["success"]:
        return {"exists": False, "message": "No face detected"}

    # Compare against all registered voters
    all_voters = await db.execute(
        select(Voter).where(Voter.face_embedding != None)
    )
    voters = all_voters.scalars().all()

    for voter in voters:
        match = match_faces(voter.face_embedding, data.face_image)
        if match["match"]:
            return {
                "exists": True,
                "message": f"This face is already registered (Voter ID: {voter.voter_id})"
            }

    return {"exists": False, "message": "Face not found — proceed"}


# =====================================
# ADMIN STATS
# GET /admin/stats
# =====================================

@app.get("/admin/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    from sqlalchemy import func as sqlfunc

    total_voters = await db.scalar(select(sqlfunc.count(Voter.id)))
    votes_cast   = await db.scalar(select(sqlfunc.count(Voter.id)).where(Voter.has_voted == True))
    pending      = await db.scalar(select(sqlfunc.count(Voter.id)).where(Voter.is_pending == True))
    turnout      = round((votes_cast / total_voters * 100), 1) if total_voters > 0 else 0

    return {
        "total_voters": total_voters,
        "votes_cast": votes_cast,
        "turnout": turnout,
        "pending": pending,
    }


# =====================================
# ADMIN — FLAG VOTER FOR MANUAL REVIEW
# POST /admin/flag-voter/{voter_id}
# =====================================

class FlagVoterSchema(BaseModel):
    reason: str = "Flagged by admin for manual review"

@app.post("/admin/flag-voter/{voter_id}")
async def flag_voter(
    voter_id: str,
    data: FlagVoterSchema,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    result = await db.execute(select(Voter).where(Voter.voter_id == voter_id))
    voter = result.scalars().first()

    if not voter:
        raise HTTPException(status_code=404, detail="Voter not found")

    voter.is_pending = True
    voter.pending_reason = data.reason
    await db.commit()

    await audit(db, "FLAG_VOTER", f"Voter {voter_id} flagged: {data.reason}", "warning")

    return {"success": True, "message": f"Voter {voter_id} flagged for manual review"}


# =====================================
# ADMIN — GET ALL VOTERS (with status)
# GET /admin/voters
# =====================================

@app.get("/admin/voters")
async def get_all_voters(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin)
):
    result = await db.execute(select(Voter))
    voters = result.scalars().all()
    return [
        {
            "voter_id": v.voter_id,
            "full_name": v.full_name,
            "cnic": v.cnic,
            "constituency": v.constituency,
            "has_voted": v.has_voted,
            "is_pending": v.is_pending,
            "pending_reason": v.pending_reason,
            "created_at": str(v.created_at),
        }
        for v in voters
    ]
