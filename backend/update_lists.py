import os

def update_user_routes():
    path = "app/routes/user_routes.py"
    with open(path, "r") as f:
        content = f.read()

    # We need to inject main.require_admin and update get_all_users
    if "from main import require_admin" not in content:
        content = content.replace("from app.utils.security import hash_password_bcrypt", "from app.utils.security import hash_password_bcrypt\nfrom main import require_admin")

    new_get_all = """@router.get("/", response_model=list[UserResponse])
async def get_all_users(
    current_admin: dict = Depends(require_admin), 
    db: AsyncSession = Depends(get_db)
):
    grantor_level = current_admin.get("level", 10)
    is_env_bypass = current_admin.get("is_env_bypass", False)
    
    query = select(User).order_by(User.created_at.desc())
    
    if not is_env_bypass:
        admin_res = await db.execute(select(User).where(User.username == current_admin.get("sub")))
        admin_user = admin_res.scalars().first()
        if admin_user:
            if grantor_level == 80: # State Admin
                query = query.where(User.state_id == admin_user.state_id)
            elif grantor_level == 70: # District Admin
                query = query.where(User.district_id == admin_user.district_id)
            elif grantor_level == 60: # Polling Station Officer
                query = query.where(User.user_id == admin_user.user_id)
            
    users_res = await db.execute(query)
    users = users_res.scalars().all()
    
    roles_res = await db.execute(select(Role))
    roles_map = {r.role_id: r.role_name for r in roles_res.scalars().all()}
    
    return [
        UserResponse(
            user_id=u.user_id,
            full_name=u.full_name,
            email=u.email,
            role=roles_map.get(u.role_id, "unknown"),
            created_at=u.created_at
        )
        for u in users
    ]"""
    
    # We will just replace the old get_all_users
    import re
    # Match the get_all_users function block up to the return statement
    pattern = re.compile(r'@router\.get\("/", response_model=list\[UserResponse\]\)\s+async def get_all_users.*?(?=\n@router\.)', re.DOTALL)
    
    content = pattern.sub(new_get_all + "\n\n", content)
    with open(path, "w") as f:
        f.write(content)


def update_district_routes():
    path = "app/routes/district_routes.py"
    with open(path, "r") as f:
        content = f.read()

    new_get_all = """@router.get("/", response_model=list[DistrictResponse])
async def get_all_districts(db: AsyncSession = Depends(get_db), current_admin: dict = Depends(require_admin)):
    \"\"\"Return all districts from the database.\"\"\"
    if current_admin.get("role_name") == "technical_support":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = select(District).order_by(District.district_name)
    
    grantor_level = current_admin.get("level", 10)
    is_env_bypass = current_admin.get("is_env_bypass", False)
    
    if not is_env_bypass:
        from app.models import User
        admin_res = await db.execute(select(User).where(User.username == current_admin.get("sub")))
        admin_user = admin_res.scalars().first()
        if admin_user:
            if grantor_level == 80:
                query = query.where(District.state_id == admin_user.state_id)
            elif grantor_level == 70:
                query = query.where(District.district_id == admin_user.district_id)
                
    result = await db.execute(query)
    return result.scalars().all()"""

    import re
    pattern = re.compile(r'@router\.get\("/", response_model=list\[DistrictResponse\]\)\s+async def get_all_districts.*?(?=\n@router\.)', re.DOTALL)
    
    content = pattern.sub(new_get_all + "\n\n", content)
    with open(path, "w") as f:
        f.write(content)


def update_polling_station_routes():
    path = "app/routes/polling_station_routes.py"
    with open(path, "r") as f:
        content = f.read()

    new_get_all = """@router.get("/", response_model=list[PollingStationResponse])
async def get_all_polling_stations(db: AsyncSession = Depends(get_db), current_admin: dict = Depends(require_admin)):
    \"\"\"Return all polling stations.\"\"\"
    if current_admin.get("role_name") == "technical_support":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    query = select(PollingStation).order_by(PollingStation.station_name)
    
    grantor_level = current_admin.get("level", 10)
    is_env_bypass = current_admin.get("is_env_bypass", False)
    
    if not is_env_bypass:
        from app.models import User, District
        admin_res = await db.execute(select(User).where(User.username == current_admin.get("sub")))
        admin_user = admin_res.scalars().first()
        if admin_user:
            if grantor_level == 80:
                # State Admin sees stations in their state
                # Need to join District
                query = query.join(District, PollingStation.district_id == District.district_id).where(District.state_id == admin_user.state_id)
            elif grantor_level == 70:
                query = query.where(PollingStation.district_id == admin_user.district_id)
            elif grantor_level == 60:
                query = query.where(PollingStation.station_id == admin_user.polling_station_id)
                
    result = await db.execute(query)
    return result.scalars().all()"""

    import re
    pattern = re.compile(r'@router\.get\("/", response_model=list\[PollingStationResponse\]\)\s+async def get_all_polling_stations.*?(?=\n@router\.)', re.DOTALL)
    
    content = pattern.sub(new_get_all + "\n\n", content)
    with open(path, "w") as f:
        f.write(content)


if __name__ == "__main__":
    update_user_routes()
    update_district_routes()
    update_polling_station_routes()
    print("Updated routes successfully")
