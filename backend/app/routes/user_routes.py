import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models import User, Role
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.utils.security import hash_password_bcrypt, require_admin

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/", response_model=list[UserResponse])
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
    ]


@router.get("/count")
async def get_user_count(db: AsyncSession = Depends(get_db)):
    """Get total user count for dashboard stats."""
    result = await db.execute(select(func.count(User.user_id)))
    count = result.scalar()
    return {"total_users": count}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a single user by UUID."""
    result = await db.execute(select(User).where(User.user_id == user_id))
    u = result.scalars().first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
        
    role_res = await db.execute(select(Role).where(Role.role_id == u.role_id))
    role_obj = role_res.scalars().first()
    role_name = role_obj.role_name if role_obj else "viewer"
    
    return UserResponse(
        user_id=u.user_id,
        full_name=u.full_name,
        email=u.email,
        role=role_name,
        created_at=u.created_at
    )


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    email_clean = (payload.email or "").strip().lower()
    full_name_clean = (payload.full_name or "").strip() or email_clean
    if not email_clean:
        raise HTTPException(status_code=400, detail="Email is required")

    # Check if user with this email already exists
    existing = await db.execute(select(User).where(func.lower(User.email) == email_clean))
    existing_user = existing.scalars().first()
    if existing_user:
        role_res = await db.execute(select(Role).where(Role.role_id == existing_user.role_id))
        role_obj = role_res.scalars().first()
        return UserResponse(
            user_id=existing_user.user_id,
            full_name=existing_user.full_name,
            email=existing_user.email,
            role=role_obj.role_name if role_obj else payload.role,
            created_at=existing_user.created_at
        )

    # Find or auto-create role
    role_res = await db.execute(select(Role).where(Role.role_name == payload.role))
    role_obj = role_res.scalars().first()
    if not role_obj:
        role_obj = Role(role_name=payload.role, description=f"{payload.role} role")
        db.add(role_obj)
        await db.commit()
        await db.refresh(role_obj)

    user_pwd = (payload.password or "").strip() or "defaultpassword"
    username_clean = (payload.username or "").strip().lower() or email_clean
    # Check if username already exists
    existing_username = await db.execute(select(User).where(func.lower(User.username) == username_clean))
    if existing_username.scalars().first():
        username_clean = email_clean  # fallback to email if username taken
    new_user = User(
        user_id=uuid.uuid4(),
        full_name=full_name_clean,
        email=email_clean,
        username=username_clean,
        password_hash=hash_password_bcrypt(user_pwd),
        role_id=role_obj.role_id,
        is_active=True,
        permissions=payload.permissions or []
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return UserResponse(
        user_id=new_user.user_id,
        full_name=new_user.full_name,
        email=new_user.email,
        role=role_obj.role_name,
        created_at=new_user.created_at
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        # Check email uniqueness excluding current user
        existing = await db.execute(
            select(User).where(User.email == payload.email, User.user_id != user_id)
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use by another user."
            )
        user.email = payload.email
        user.username = payload.email
        
    role_name = "viewer"
    if payload.role is not None:
        role_res = await db.execute(select(Role).where(Role.role_name == payload.role))
        role_obj = role_res.scalars().first()
        if not role_obj:
            raise HTTPException(status_code=400, detail=f"Role '{payload.role}' does not exist")
        user.role_id = role_obj.role_id
        role_name = role_obj.role_name
    else:
        role_res = await db.execute(select(Role).where(Role.role_id == user.role_id))
        role_obj = role_res.scalars().first()
        role_name = role_obj.role_name if role_obj else "viewer"

    await db.commit()
    await db.refresh(user)
    
    return UserResponse(
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        role=role_name,
        created_at=user.created_at
    )


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()