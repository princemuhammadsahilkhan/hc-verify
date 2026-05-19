from pydantic import BaseModel


class RegisterSchema(BaseModel):
    full_name: str
    cnic: str
    phone: str
    constituency: str

class VoteSchema(BaseModel):

    voter_id: str

    candidate_id: int