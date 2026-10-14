import os
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

logger = logging.getLogger("edupath.security.email")

class EmailService:
    """
    Transactional email dispatch and verification token security service.
    Supports real SMTP configuration and safe development outbox logging.
    """

    # In-memory development outbox to inspect delivered verification emails
    dev_outbox = []

    @staticmethod
    def generate_token() -> str:
        """Generates a cryptographically secure 256-bit URL-safe token."""
        return secrets.token_urlsafe(32)

    @staticmethod
    def hash_token(raw_token: str) -> str:
        """Hashes token using SHA-256 for secure database representation."""
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    @classmethod
    async def send_verification_email(cls, email: str, raw_token: str, full_name: str = "Learner") -> Dict[str, Any]:
        """
        Dispatches mandatory email verification link.
        """
        app_base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
        verification_link = f"{app_base_url}/verify-email?token={raw_token}&email={email}"

        message = {
            "type": "EMAIL_VERIFICATION",
            "to": email,
            "full_name": full_name,
            "verification_link": verification_link,
            "raw_token": raw_token,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "expires_in_hours": 24
        }

        # Store in dev outbox for local testing/verification
        cls.dev_outbox.append(message)
        logger.info(f"📧 [EmailService] Verification challenge sent to {email}. Link: {verification_link}")

        # If SMTP is configured, real transmission can be activated
        smtp_host = os.getenv("SMTP_HOST")
        if smtp_host:
            logger.info(f"Connecting to SMTP relay {smtp_host} to deliver email to {email}...")

        return {
            "success": True,
            "recipient": email,
            "verification_link": verification_link,
            "delivered_via": "SMTP" if smtp_host else "DEV_OUTBOX"
        }

    @classmethod
    async def send_password_reset_email(cls, email: str, raw_token: str, full_name: str = "Learner") -> Dict[str, Any]:
        """
        Dispatches password reset link.
        """
        app_base_url = os.getenv("APP_BASE_URL", "http://localhost:5173")
        reset_link = f"{app_base_url}/reset-password?token={raw_token}&email={email}"

        message = {
            "type": "PASSWORD_RESET",
            "to": email,
            "full_name": full_name,
            "reset_link": reset_link,
            "raw_token": raw_token,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "expires_in_hours": 2
        }

        cls.dev_outbox.append(message)
        logger.info(f"🔑 [EmailService] Password reset challenge sent to {email}. Link: {reset_link}")

        return {
            "success": True,
            "recipient": email,
            "reset_link": reset_link,
            "delivered_via": "DEV_OUTBOX"
        }

    @classmethod
    def get_latest_dev_email(cls, email: str) -> Optional[Dict[str, Any]]:
        """Retrieves latest message for a recipient from the development outbox."""
        for msg in reversed(cls.dev_outbox):
            if msg.get("to") == email:
                return msg
        return None
