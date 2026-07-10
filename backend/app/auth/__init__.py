from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Voter
from app.schemas import VoterCreate, LoginSchema

from app.utils.security import hash_password, verify_password
from app.utils.jwt_handler import create_access_token

router = APIRouter()


# REGISTER API
@router.post("/register")
def register(voter: VoterCreate, db: Session = Depends(get_db)):

    existing = db.query(Voter).filter(Voter.email == voter.email).first()

    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed = hash_password(voter.password)

    new_voter = Voter(
        full_name=voter.full_name,
        email=voter.email,
        password=hashed,
        cnic=voter.cnic,
        district=voter.district
    )

    db.add(new_voter)
    db.commit()

    return {"message": "User registered successfully"}


# LOGIN API
@router.post("/login")
def login(user: LoginSchema, db: Session = Depends(get_db)):

    voter = db.query(Voter).filter(Voter.email == user.email).first()

    if not voter:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not verify_password(user.password, voter.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    token = create_access_token(data={"sub": voter.email})

    return {
        "access_token": token,
        "token_type": "bearer"
    }