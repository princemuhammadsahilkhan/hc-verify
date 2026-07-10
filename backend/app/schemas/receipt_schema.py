import uuid
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VoteReceiptSchema(BaseModel):
    receipt_id: uuid.UUID
    vote_id: int
    election_id: Optional[uuid.UUID]
    timestamp: datetime
    polling_station: Optional[str]
    district: Optional[str]
    cryptographic_hash: Optional[str]
    qr_code_data: Optional[str]
    verification_code: str
    status: str

    class Config:
        from_attributes = True