import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.database import Base, engine as pg_engine
from app.models import Voter, Candidate, Vote, AuditLog
import os
from dotenv import load_dotenv

load_dotenv()

# We construct a separate session maker for the source SQLite database
sqlite_engine = create_async_engine("sqlite+aiosqlite:///./hc_verify.db")
SqliteSessionLocal = sessionmaker(
    bind=sqlite_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

PgSessionLocal = sessionmaker(
    bind=pg_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def migrate():
    print("Starting database migration from SQLite to PostgreSQL...")

    # Step 1: Create all tables in PostgreSQL
    print("Creating tables in PostgreSQL if they do not exist...")
    async with pg_engine.begin() as pg_conn:
        await pg_conn.run_sync(Base.metadata.create_all)
    print("Tables verified/created in PostgreSQL.")

    # Step 2: Migrate Candidates
    async with SqliteSessionLocal() as sqlite_session, PgSessionLocal() as pg_session:
        # We process each model
        # Candidates first because Votes have a ForeignKey relation to Candidates
        print("\nMigrating Candidates...")
        candidate_res = await sqlite_session.execute(select(Candidate))
        candidates = candidate_res.scalars().all()
        print(f"Found {len(candidates)} candidates in SQLite.")
        
        # Check if candidates already exist in Postgres to prevent duplicates
        pg_candidate_res = await pg_session.execute(select(Candidate))
        pg_candidates = pg_candidate_res.scalars().all()
        if len(pg_candidates) > 0:
            print("Candidates already exist in PostgreSQL. Skipping Candidates migration.")
        else:
            for c in candidates:
                new_c = Candidate(
                    id=c.id,
                    name=c.name,
                    party=c.party,
                    symbol=c.symbol,
                    district=c.district,
                    constituency=c.constituency,
                    votes=c.votes,
                    created_at=c.created_at
                )
                pg_session.add(new_c)
            await pg_session.commit()
            print("Candidates migrated successfully.")

        # Step 3: Migrate Voters
        print("\nMigrating Voters...")
        voter_res = await sqlite_session.execute(select(Voter))
        voters = voter_res.scalars().all()
        print(f"Found {len(voters)} voters in SQLite.")
        
        # Check if voters already exist in Postgres
        pg_voter_res = await pg_session.execute(select(Voter))
        pg_voters = pg_voter_res.scalars().all()
        existing_voters_ids = {v.voter_id for v in pg_voters}
        
        migrated_voters_count = 0
        for v in voters:
            if v.voter_id not in existing_voters_ids:
                new_v = Voter(
                    id=v.id,
                    voter_id=v.voter_id,
                    full_name=v.full_name,
                    email=v.email,
                    password=v.password,
                    cnic=v.cnic,
                    district=v.district,
                    phone=v.phone,
                    constituency=v.constituency,
                    has_voted=v.has_voted,
                    is_verified=v.is_verified,
                    face_embedding=v.face_embedding,
                    is_pending=v.is_pending,
                    pending_reason=v.pending_reason,
                    registration_hash=v.registration_hash,
                    created_at=v.created_at
                )
                pg_session.add(new_v)
                migrated_voters_count += 1
        
        if migrated_voters_count > 0:
            await pg_session.commit()
            print(f"Migrated {migrated_voters_count} voters successfully.")
        else:
            print("No new voters to migrate.")

        # Step 4: Migrate Votes
        print("\nMigrating Votes...")
        vote_res = await sqlite_session.execute(select(Vote))
        votes = vote_res.scalars().all()
        print(f"Found {len(votes)} votes in SQLite.")
        
        pg_vote_res = await pg_session.execute(select(Vote))
        pg_votes = pg_vote_res.scalars().all()
        existing_vote_codes = {vt.receipt_code for vt in pg_votes}
        
        migrated_votes_count = 0
        for vt in votes:
            if vt.receipt_code not in existing_vote_codes:
                new_vt = Vote(
                    id=vt.id,
                    voter_id=vt.voter_id,
                    candidate_id=vt.candidate_id,
                    receipt_code=vt.receipt_code,
                    vote_hash=vt.vote_hash,
                    blockchain_hash=vt.blockchain_hash,
                    timestamp=vt.timestamp,
                    created_at=vt.created_at
                )
                pg_session.add(new_vt)
                migrated_votes_count += 1
                
        if migrated_votes_count > 0:
            await pg_session.commit()
            print(f"Migrated {migrated_votes_count} votes successfully.")
        else:
            print("No new votes to migrate.")

        # Step 5: Migrate Audit Logs
        print("\nMigrating Audit Logs...")
        audit_res = await sqlite_session.execute(select(AuditLog))
        audits = audit_res.scalars().all()
        print(f"Found {len(audits)} audit logs in SQLite.")
        
        # Check count of existing pg audit logs to avoid duplicate migration
        pg_audit_count_res = await pg_session.execute(select(AuditLog))
        pg_audits = pg_audit_count_res.scalars().all()
        
        if len(pg_audits) > 0:
            print("Audit logs already exist in PostgreSQL. Skipping Audit Logs migration to avoid duplicates.")
        else:
            for a in audits:
                new_a = AuditLog(
                    id=a.id,
                    action=a.action,
                    details=a.details,
                    timestamp=a.timestamp,
                    severity=a.severity,
                    created_at=a.created_at
                )
                pg_session.add(new_a)
            if len(audits) > 0:
                await pg_session.commit()
                print(f"Migrated {len(audits)} audit logs successfully.")
            else:
                print("No audit logs to migrate.")

    print("\nDatabase migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate())
