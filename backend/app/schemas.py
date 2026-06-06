from typing import Optional

from pydantic import BaseModel


class RegisterSchema(BaseModel):
    full_name: str
    cnic: str
    phone: str
    constituency: str


class VoterCreate(BaseModel):
    full_name: str
    email: str
    password: str
    cnic: str
    district: str
    phone: Optional[str] = None
    constituency: Optional[str] = None


class AuthRegisterSchema(BaseModel):
    full_name: str
    email: str
    password: str
    district: str
    phone: Optional[str] = None
    constituency: Optional[str] = None


class AuthUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    district: Optional[str] = None


class LoginSchema(BaseModel):
    email: str
    password: str


class CandidateCreateSchema(BaseModel):
    name: str
    party: str
    district: str
    symbol: Optional[str] = None

class VoteSchema(BaseModel):

    voter_id: Optional[str] = None

    candidate_id: int