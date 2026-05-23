from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text
)

from sqlalchemy.sql import func

from app.database import Base


class Voter(Base):

    __tablename__ = "voters"

    id = Column(Integer, primary_key=True, index=True)

    voter_id = Column(String, unique=True, nullable=False)

    full_name = Column(String, nullable=False)

    cnic = Column(String, unique=True, nullable=False)

    phone = Column(String, nullable=False)

    constituency = Column(String, nullable=False)

    has_voted = Column(Boolean, default=False)

    is_verified = Column(Boolean, default=True)

    # Face recognition
    face_embedding = Column(Text, nullable=True)  # JSON string of embedding vector

    # Pending investigation (face mismatch at voting time)
    is_pending = Column(Boolean, default=False)

    pending_reason = Column(String, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Candidate(Base):

    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    party = Column(String, nullable=False)

    symbol = Column(String)

    constituency = Column(String)

    votes = Column(Integer, default=0)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class Vote(Base):

    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)

    voter_id = Column(
        Integer,
        ForeignKey("voters.id")
    )

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id")
    )

    receipt_code = Column(
        String,
        unique=True
    )

    blockchain_hash = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    action = Column(String)

    details = Column(Text)

    severity = Column(
        String,
        default="info"
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )