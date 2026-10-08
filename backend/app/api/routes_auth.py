from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.app.database.connection import get_db
from backend.app.models.entities import User, LearnerProfile
from backend.app.security.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = "Student"

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await AuthService.authenticate_user(db, req.username, req.password)
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already in use.")
        
    hashed = AuthService.hash_password(req.password)
    new_user = User(
        username=req.username,
        email=req.email,
        full_name=req.full_name,
        hashed_password=hashed
    )
    db.add(new_user)
    await db.flush()

    profile = LearnerProfile(user_id=new_user.id)
    db.add(profile)
    await db.commit()

    token = AuthService.create_access_token({"sub": new_user.id, "username": new_user.username})
    return {
        "status": "AUTHENTICATED",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.authenticate_user(db, req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = AuthService.create_access_token({"sub": user.id, "username": user.username})
    return {
        "status": "AUTHENTICATED",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_demo_user": user.is_demo_user
        }
    }

@router.post("/demo-login")
async def demo_login(db: AsyncSession = Depends(get_db)):
    """Provides instantaneous single-click login as demo learner Alex Rivera."""
    demo_user = await AuthService.get_or_create_demo_user(db)
    token = AuthService.create_access_token({"sub": demo_user.id, "username": demo_user.username, "demo": True})
    return {
        "status": "DEMO_AUTHENTICATED",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": demo_user.id,
            "username": demo_user.username,
            "email": demo_user.email,
            "full_name": demo_user.full_name,
            "is_demo_user": True
        }
    }

@router.get("/me")
async def get_current_user(token: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    if not token:
        # Fallback to demo user for seamless offline evaluation
        demo_user = await AuthService.get_or_create_demo_user(db)
        return {
            "status": "DEMO_AUTHENTICATED",
            "user": {
                "id": demo_user.id,
                "username": demo_user.username,
                "email": demo_user.email,
                "full_name": demo_user.full_name,
                "is_demo_user": True
            }
        }
    
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    
    user_id = payload.get("sub")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    return {
        "status": "AUTHENTICATED",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_demo_user": user.is_demo_user
        }
    }
