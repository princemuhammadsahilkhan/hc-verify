import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.models import User, Role
from app.schemas.user_schema import UserCreate, UserUpdate, UserResponse
from app.utils.security import hash_password_bcrypt

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


@router.get("/", response_model=list[UserResponse])
async def get_all_users(db: AsyncSession = Depends(get_db)):
    """Get all admin users."""
    users_res = await db.execute(select(User).order_by(User.created_at.desc()))
    users = users_res.scalars().all()
    
    roles_res = await db.execute(select(Role))
    roles_map = {r.role_id: r.role_name for r in roles_res.scalars().all()}
    
    return [
        UserResponse(
            user_id=u.user_id,
            full_name=u.full_name,
            email=u.email,
            role=roles_map.get(u.role_id, "viewer"),
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
    admin_user = locals().get('admin_user') or locals().get('_', {})
    if admin_user.get('role_name') in ['auditor', 'observer', 'voter', 'technical_support']:
        raise HTTPException(status_code=403, detail='Role is read-only and cannot perform this action.')
        
    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Find role
    role_res = await db.execute(select(Role).where(Role.role_name == payload.role))
    role_obj = role_res.scalars().first()
    if not role_obj:
        raise HTTPException(status_code=400, detail=f"Role '{payload.role}' does not exist")

    new_user = User(
        user_id=uuid.uuid4(),
        full_name=payload.full_name,
        email=payload.email,
        username=payload.email,
        password_hash=hash_password_bcrypt("defaultpassword"),
        role_id=role_obj.role_id,
        is_active=True
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
    admin_user = locals().get('admin_user') or locals().get('_', {})
    if admin_user.get('role_name') in ['auditor', 'observer', 'voter', 'technical_support']:
        raise HTTPException(status_code=403, detail='Role is read-only and cannot perform this action.')
        
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
    admin_user = locals().get('admin_user') or locals().get('_', {})
    if admin_user.get('role_name') in ['auditor', 'observer', 'voter', 'technical_support']:
        raise HTTPException(status_code=403, detail='Role is read-only and cannot perform this action.')
        
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()