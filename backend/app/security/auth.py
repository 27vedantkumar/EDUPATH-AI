import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from passlib.context import CryptContext
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.config.settings import settings
from backend.app.models.entities import User, LearnerProfile

logger = logging.getLogger("edupath.security.auth")

import hashlib
import os

class AuthService:
    """
    Manages secure authentication, password hashing, JWT generation,
    and demo session handling with explicit states:
    AUTH_LOADING, AUTHENTICATED, UNAUTHENTICATED, DEMO_AUTHENTICATED.
    """

    @staticmethod
    def hash_password(password: str) -> str:
        salt = os.urandom(16).hex()
        dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
        return f"{salt}${dk}"

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            if "$" not in hashed_password:
                return False
            salt, dk = hashed_password.split("$", 1)
            test_dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
            return test_dk == dk
        except Exception:
            return False

    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError:
            return None

    @classmethod
    async def authenticate_user(
        cls,
        db: AsyncSession,
        username_or_email: str,
        password: str
    ) -> Optional[User]:
        stmt = select(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        )
        res = await db.execute(stmt)
        user = res.scalars().first()
        if not user:
            return None
        if not cls.verify_password(password, user.hashed_password):
            return None
        return user

    @classmethod
    async def get_or_create_demo_user(
        cls,
        db: AsyncSession
    ) -> User:
        """Provides an instant, ready-to-explore demo learner profile for hackathon demos."""
        res = await db.execute(select(User).filter(User.username == "alex_rivera"))
        demo_user = res.scalars().first()
        if not demo_user:
            demo_user = User(
                username="alex_rivera",
                email="alex.rivera@edupath.ai",
                full_name="Alex Rivera",
                hashed_password=cls.hash_password("DemoPass123!"),
                is_demo_user=True,
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
            )
            db.add(demo_user)
            await db.flush()

            profile = LearnerProfile(
                user_id=demo_user.id,
                overall_mastery=0.62,
                learning_goal="Ace Operating Systems & Distributed Systems",
                daily_study_goal_minutes=45,
                xp_points=1240,
                level=4,
                current_streak_days=7
            )
            db.add(profile)
            await db.commit()

        return demo_user
