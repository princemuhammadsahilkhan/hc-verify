import asyncio
from sqlalchemy import text
from app.database import engine, Base
from app.models import State, RoleGrantAudit

async def run_migration():
    async with engine.begin() as conn:
        print("Creating new tables: states, role_grants_audit...")
        # create new tables
        await conn.run_sync(State.__table__.create, checkfirst=True)
        await conn.run_sync(RoleGrantAudit.__table__.create, checkfirst=True)

        print("Adding state_id to districts and users...")
        # Add new columns safely
        try:
            await conn.execute(text("ALTER TABLE districts ADD COLUMN state_id UUID REFERENCES states(state_id)"))
        except Exception as e:
            if "duplicate column name" not in str(e).lower() and "already exists" not in str(e).lower():
                print(f"Warning/Error altering districts: {e}")

        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN state_id UUID REFERENCES states(state_id)"))
        except Exception as e:
            if "duplicate column name" not in str(e).lower() and "already exists" not in str(e).lower():
                print(f"Warning/Error altering users: {e}")

        print("Adding level to roles...")
        try:
            await conn.execute(text("ALTER TABLE roles ADD COLUMN level INTEGER"))
        except Exception as e:
            if "duplicate column name" not in str(e).lower() and "already exists" not in str(e).lower():
                print(f"Warning/Error altering roles: {e}")

        print("Seeding initial role levels...")
        # Upsert or update roles
        roles_data = [
            ("super_admin", 100),
            ("election_commissioner", 90),
            ("state_admin", 80),
            ("district_admin", 70),
            ("polling_station_officer", 60),
            ("viewer", 10)
        ]
        
        for r_name, r_level in roles_data:
            # Check if role exists
            result = await conn.execute(text("SELECT role_id FROM roles WHERE role_name = :r_name"), {"r_name": r_name})
            row = result.fetchone()
            if row:
                await conn.execute(text("UPDATE roles SET level = :r_level WHERE role_name = :r_name"), {"r_level": r_level, "r_name": r_name})
            else:
                await conn.execute(text("INSERT INTO roles (role_name, level) VALUES (:r_name, :r_level)"), {"r_name": r_name, "r_level": r_level})

    print("Migration complete.")

if __name__ == "__main__":
    asyncio.run(run_migration())
