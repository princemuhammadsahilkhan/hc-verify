from fastapi.security import HTTPAuthorizationCredentials
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models import User, Role, RoleGrantAudit, State, District, PollingStation
from app.utils.security import hash_password_bcrypt, require_admin

router = APIRouter(prefix="/admin/grants", tags=["Role Grants"])

class GrantRoleRequest(BaseModel):
    email: str
    full_name: str
    role_name: str
    state_id: Optional[uuid.UUID] = None
    district_id: Optional[uuid.UUID] = None
    polling_station_id: Optional[uuid.UUID] = None

class AcceptInviteRequest(BaseModel):
    invite_token: str
    new_password: str

@router.post("/accept-invite", status_code=200)
async def accept_invite(payload: AcceptInviteRequest, db: AsyncSession = Depends(get_db)):
    # Hash token using SHA-256 for deterministic DB lookup
    token_hash = hashlib.sha256(payload.invite_token.encode()).hexdigest()
    
    res = await db.execute(select(User).where(User.invite_token_hash == token_hash))
    user = res.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid invite token.")
        
    from datetime import timezone
    if user.invite_expires_at:
        # handle naive vs aware
        expires = user.invite_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=400, detail="This invite has expired. Please ask your administrator to re-issue the invite.")
        
    # Apply new password and kill the token
    user.password_hash = hash_password_bcrypt(payload.new_password)
    user.invite_token_hash = None
    user.invite_expires_at = None
    
    await db.commit()
    return {"message": "Password set successfully. You may now log in."}


@router.post("/", status_code=201)
async def grant_admin_role(
    payload: GrantRoleRequest,
    current_admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    grantor_level = current_admin.get("level", 10)
    is_env_bypass = current_admin.get("is_env_bypass", False)
    
    grantor_user = None
    if not is_env_bypass:
        res = await db.execute(select(User).where(User.username == current_admin.get("sub")))
        grantor_user = res.scalars().first()

    # 1. Enforce Sequence: One level down via dynamic DB lookup
    highest_lesser_res = await db.execute(
        select(Role.level)
        .where(Role.level < grantor_level)
        .order_by(Role.level.desc())
        .limit(1)
    )
    required_level = highest_lesser_res.scalar()
    
    if required_level is None:
        raise HTTPException(status_code=403, detail="You are at the bottom of the administrative hierarchy and cannot grant roles.")

    target_role_res = await db.execute(select(Role).where(Role.role_name == payload.role_name))
    target_role = target_role_res.scalars().first()
    
    if not target_role or target_role.level != required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=f"Hierarchy violation: You (level {grantor_level}) can only grant roles exactly one level below you (level {required_level}). Target is level {target_role.level if target_role else 'None'}."
        )

    # 2. Jurisdiction Nesting Rules (Real Parent Lookup)
    derived_state_id = None
    derived_district_id = None

    if target_role.level == 80: # Granting a State Admin
        if not payload.state_id:
            raise HTTPException(status_code=400, detail="state_id is required for State Admin role.")
        state_res = await db.execute(select(State).where(State.state_id == payload.state_id))
        target_state = state_res.scalars().first()
        if not target_state:
            raise HTTPException(status_code=404, detail="Target state not found.")
        derived_state_id = target_state.state_id

    elif target_role.level == 70: # Granting a District Admin
        if not payload.district_id:
            raise HTTPException(status_code=400, detail="district_id is required for District Admin role.")
            
        dist_res = await db.execute(select(District).where(District.district_id == payload.district_id))
        target_district = dist_res.scalars().first()
        
        if not target_district:
            raise HTTPException(status_code=404, detail="Target district not found.")
            
        # Verify real relationship if grantor is State Admin
        if grantor_user and grantor_level == 80:
            if str(target_district.state_id) != str(grantor_user.state_id):
                raise HTTPException(status_code=403, detail="Jurisdiction violation: You can only grant District Admin roles for districts belonging to your own state.")
                
        derived_district_id = target_district.district_id
        derived_state_id = target_district.state_id

    elif target_role.level == 60: # Granting a Polling Station Officer
        if not payload.polling_station_id:
            raise HTTPException(status_code=400, detail="polling_station_id is required for Polling Station Officer role.")
            
        stat_res = await db.execute(select(PollingStation).where(PollingStation.station_id == payload.polling_station_id))
        target_station = stat_res.scalars().first()
        
        if not target_station:
            raise HTTPException(status_code=404, detail="Target polling station not found.")
            
        # Verify real relationship if grantor is District Admin
        if grantor_user and grantor_level == 70:
            if str(target_station.district_id) != str(grantor_user.district_id):
                raise HTTPException(status_code=403, detail="Jurisdiction violation: You can only grant Station Officer roles for stations belonging to your own district.")
                
        derived_district_id = target_station.district_id
        
        if derived_district_id:
            parent_dist_res = await db.execute(select(District).where(District.district_id == derived_district_id))
            parent_dist = parent_dist_res.scalars().first()
            if parent_dist:
                derived_state_id = parent_dist.state_id

    # 3. Create grantee with Invite Token
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Email already exists.")

    invite_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(invite_token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(hours=48)
    
    new_user = User(
        user_id=uuid.uuid4(),
        full_name=payload.full_name,
        username=payload.email,
        email=payload.email,
        password_hash="INVITED_NO_PASSWORD",
        invite_token_hash=token_hash,
        invite_expires_at=expires_at,
        role_id=target_role.role_id,
        state_id=derived_state_id, # Derived strictly from real DB foreign keys
        district_id=derived_district_id,
        polling_station_id=payload.polling_station_id if target_role.level == 60 else None,
        is_active=True
    )
    db.add(new_user)
    await db.flush()

    # 4. Log to Audit Table (Accurate Jurisdiction Level)
    jur_level = "national"
    if target_role.level == 80: jur_level = "state"
    elif target_role.level == 70: jur_level = "district"
    elif target_role.level == 60: jur_level = "station"

    audit_entry = RoleGrantAudit(
        grant_id=uuid.uuid4(),
        grantor_id=grantor_user.user_id if grantor_user else uuid.UUID(int=0),
        grantee_id=new_user.user_id,
        role_id=target_role.role_id,
        jurisdiction_level=jur_level,
        jurisdiction_id=derived_state_id or derived_district_id or payload.polling_station_id,
        action="GRANTED"
    )
    db.add(audit_entry)
    await db.commit()
    
    return {
        "message": "Role granted successfully", 
        "user_id": new_user.user_id,
        "invite_token": invite_token
    }


@router.delete("/{user_id}/revoke", status_code=204)
async def revoke_admin_role(
    user_id: uuid.UUID,
    current_admin: dict = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    grantor_level = current_admin.get("level", 10)
    is_env_bypass = current_admin.get("is_env_bypass", False)
    
    res = await db.execute(select(User).where(User.user_id == user_id))
    target_user = res.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")
        
    target_role_res = await db.execute(select(Role).where(Role.role_id == target_user.role_id))
    target_role = target_role_res.scalars().first()
    target_level = target_role.level if target_role else 10
    
    if target_user.username == current_admin.get("sub"):
        raise HTTPException(status_code=403, detail="Cannot revoke your own role.")
        
    # Cascading Revoke
    if target_level >= grantor_level:
        raise HTTPException(status_code=403, detail="Hierarchy violation: Cannot revoke a role equal to or higher than your own.")

    # Jurisdiction Check
    grantor_user = None
    if not is_env_bypass:
        grantor_res = await db.execute(select(User).where(User.username == current_admin.get("sub")))
        grantor_user = grantor_res.scalars().first()
        
        if grantor_level == 80 and str(target_user.state_id) != str(grantor_user.state_id):
            raise HTTPException(status_code=403, detail="Jurisdiction violation: Cannot revoke users outside your state.")
        if grantor_level == 70 and str(target_user.district_id) != str(grantor_user.district_id):
            raise HTTPException(status_code=403, detail="Jurisdiction violation: Cannot revoke users outside your district.")

    # Deactivate and Audit
    target_user.is_active = False
    target_user.invite_token_hash = None # Kill pending invites
    target_user.invite_expires_at = None
    
    audit_entry = RoleGrantAudit(
        grant_id=uuid.uuid4(),
        grantor_id=grantor_user.user_id if grantor_user else uuid.UUID(int=0),
        grantee_id=target_user.user_id,
        role_id=target_role.role_id,
        jurisdiction_level="revoked",
        action="REVOKED"
    )
    db.add(audit_entry)
    await db.commit()
