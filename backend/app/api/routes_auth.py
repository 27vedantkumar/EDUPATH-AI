import re
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.database.connection import get_db
from backend.app.models.entities import User, LearnerProfile
from backend.app.security.auth import AuthService
from backend.app.security.email_service import EmailService

logger = logging.getLogger("edupath.api.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

COOKIE_NAME = "edupath_session"
COOKIE_MAX_AGE = 7 * 24 * 3600  # 7 days

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = "Student"
    username: Optional[str] = None

    @field_validator("email")
    def validate_and_normalize_email(cls, v: str) -> str:
        clean = v.strip().lower()
        # Accept valid email format across ANY legitimate domain
        email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(email_regex, clean):
            raise ValueError("Invalid email address format.")
        return clean

    @field_validator("password")
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: str

class LoginRequest(BaseModel):
    username: str  # accepts username or email
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    def validate_password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Registers a new student account and initiates mandatory email verification.
    Access to protected learning features is withheld until mailbox ownership is verified.
    """
    clean_email = req.email.strip().lower()
    clean_username = req.username.strip() if req.username else clean_email.split("@")[0]

    # Check for existing email or username
    stmt = select(User).filter((User.email == clean_email) | (User.username == clean_username))
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address or username already exists."
        )

    hashed = AuthService.hash_password(req.password)
    new_user = User(
        username=clean_username,
        email=clean_email,
        full_name=req.full_name or "Student",
        hashed_password=hashed,
        is_active=True,
        is_demo_user=False,
        email_verified_at=None,
        account_status="PENDING_VERIFICATION"
    )
    db.add(new_user)
    await db.flush()

    # Create associated learner profile
    profile = LearnerProfile(
        user_id=new_user.id,
        overall_mastery=0.0,
        learning_goal="Master Course Materials",
        daily_study_goal_minutes=30,
        xp_points=0,
        level=1,
        current_streak_days=1
    )
    db.add(profile)
    await db.commit()

    # Generate cryptographically secure verification challenge
    raw_token = await AuthService.create_verification_challenge(db, new_user.id)
    dispatch_res = await EmailService.send_verification_email(new_user.email, raw_token, new_user.full_name)

    return {
        "status": "VERIFICATION_REQUIRED",
        "message": "Account created successfully. Please verify your email to activate learning access.",
        "email": new_user.email,
        "dev_verification_link": dispatch_res.get("verification_link")
    }


@router.post("/verify-email")
async def verify_email(req: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates single-use token challenge and marks mailbox as verified.
    """
    user = await AuthService.verify_email_token(db, req.token.strip())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already consumed verification link. Please request a new verification email."
        )

    logger.info(f"Verified email for user: {user.email}")
    return {
        "status": "EMAIL_VERIFIED",
        "message": "Email address verified successfully. You may now sign in.",
        "email": user.email
    }


@router.post("/resend-verification")
async def resend_verification(req: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    """
    Resends verification email for unverified accounts.
    """
    clean_email = req.email.strip().lower()
    stmt = select(User).filter(User.email == clean_email)
    user = (await db.execute(stmt)).scalars().first()

    if user and user.email_verified_at is None:
        raw_token = await AuthService.create_verification_challenge(db, user.id)
        dispatch_res = await EmailService.send_verification_email(user.email, raw_token, user.full_name)
        return {
            "status": "CHALLENGE_DISPATCHED",
            "message": "A new verification link has been sent to your email address.",
            "dev_verification_link": dispatch_res.get("verification_link")
        }

    return {
        "status": "CHALLENGE_DISPATCHED",
        "message": "If an unverified account exists with this email, a verification link has been sent."
    }


@router.post("/login")
async def login(req: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Authenticates verified user and establishes secure HTTP-only cookie session.
    Enforces mandatory email verification before dashboard entry.
    """
    user = await AuthService.authenticate_user(db, req.username.strip(), req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/username or password."
        )

    # Enforce email verification check for non-demo users
    if not user.is_demo_user and user.email_verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification is required before accessing EduPath AI. Please verify your email first."
        )

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token = AuthService.create_access_token({
        "sub": user.id,
        "username": user.username,
        "email": user.email,
        "verified": user.email_verified_at is not None
    })

    # Set secure HTTP-only cookie for session management
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False  # Set True in production HTTPS
    )

    return {
        "status": "AUTHENTICATED",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_demo_user": user.is_demo_user,
            "email_verified": user.email_verified_at is not None
        }
    }


@router.post("/demo-login")
async def demo_login(response: Response, db: AsyncSession = Depends(get_db)):
    """
    Provides instantaneous single-click login as demo learner Alex Rivera
    for hackathon judging, evaluation, and live demonstration.
    """
    demo_user = await AuthService.get_or_create_demo_user(db)
    # Ensure demo user is verified
    demo_user.email_verified_at = datetime.now(timezone.utc)
    demo_user.account_status = "ACTIVE"
    demo_user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    token = AuthService.create_access_token({
        "sub": demo_user.id,
        "username": demo_user.username,
        "email": demo_user.email,
        "demo": True,
        "verified": True
    })

    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=False
    )

    return {
        "status": "DEMO_AUTHENTICATED",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": demo_user.id,
            "username": demo_user.username,
            "email": demo_user.email,
            "full_name": demo_user.full_name,
            "is_demo_user": True,
            "email_verified": True
        }
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Initiates secure password recovery challenge.
    """
    clean_email = req.email.strip().lower()
    stmt = select(User).filter(User.email == clean_email)
    user = (await db.execute(stmt)).scalars().first()

    if user:
        raw_token = await AuthService.create_password_reset_challenge(db, user.id)
        dispatch_res = await EmailService.send_password_reset_email(user.email, raw_token, user.full_name)
        return {
            "status": "RESET_DISPATCHED",
            "message": "If an account exists with this email, password reset instructions have been sent.",
            "dev_reset_link": dispatch_res.get("reset_link")
        }

    return {
        "status": "RESET_DISPATCHED",
        "message": "If an account exists with this email, password reset instructions have been sent."
    }


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates reset token and sets new password hash.
    """
    user = await AuthService.reset_password_with_token(db, req.token.strip(), req.new_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already consumed password reset link."
        )

    return {
        "status": "PASSWORD_RESET_SUCCESS",
        "message": "Your password has been reset successfully. You may now sign in with your new password."
    }


@router.post("/logout")
async def logout(response: Response):
    """
    Clears HTTP-only cookie session and invalidates client session state.
    """
    response.delete_cookie(key=COOKIE_NAME)
    return {
        "status": "LOGGED_OUT",
        "message": "Logged out successfully."
    }


@router.get("/me")
async def get_current_user(request: Request, token: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """
    Retrieves currently authenticated user from HTTP-only cookie or Bearer authorization header.
    """
    # 1. Try reading from cookie first
    active_token = request.cookies.get(COOKIE_NAME) or token

    # 2. Try reading from Authorization Bearer header
    if not active_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            active_token = auth_header[7:].strip()

    if not active_token:
        return {
            "status": "UNAUTHENTICATED",
            "user": None
        }

    payload = AuthService.decode_token(active_token)
    if not payload:
        return {
            "status": "UNAUTHENTICATED",
            "user": None
        }

    user_id = payload.get("sub")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        return {
            "status": "UNAUTHENTICATED",
            "user": None
        }

    # Fetch learner profile
    profile_stmt = select(LearnerProfile).filter(LearnerProfile.user_id == user.id)
    profile = (await db.execute(profile_stmt)).scalars().first()

    return {
        "status": "DEMO_AUTHENTICATED" if user.is_demo_user else "AUTHENTICATED",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_demo_user": user.is_demo_user,
            "email_verified": user.email_verified_at is not None,
            "account_status": user.account_status,
            "profile": {
                "overall_mastery": profile.overall_mastery if profile else 0.62,
                "xp_points": profile.xp_points if profile else 1240,
                "level": profile.level if profile else 4,
                "current_streak_days": profile.current_streak_days if profile else 7
            }
        }
    }
