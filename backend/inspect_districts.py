import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.database import DATABASE_URL
from app.models import District, Candidate, Voter, User, PollingStation

async def check_districts():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(District))
        districts = result.scalars().all()
        
        for d in districts:
            if d.district_name.lower() in ["aq", "islamabad capital", "kpk"]:
                print(f"District: {d.district_name}, ID: {d.district_id}")
                # check candidates
                c_res = await session.execute(select(Candidate).where(Candidate.district_id == d.district_id))
                print(" Candidates:", len(c_res.scalars().all()))
                # check voters
                v_res = await session.execute(select(Voter).where(Voter.district_id == d.district_id))
                print(" Voters:", len(v_res.scalars().all()))
                # check users
                u_res = await session.execute(select(User).where(User.district_id == d.district_id))
                print(" Users:", len(u_res.scalars().all()))
                # check polling stations
                p_res = await session.execute(select(PollingStation).where(PollingStation.district_id == d.district_id))
                print(" PollingStations:", len(p_res.scalars().all()))

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_districts())
