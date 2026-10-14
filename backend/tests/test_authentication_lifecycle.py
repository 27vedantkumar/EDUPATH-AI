import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database.connection import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()

@pytest.mark.asyncio
async def test_full_authentication_lifecycle():
    import uuid
    uid = uuid.uuid4().hex[:8]
    test_email = f"sarah.{uid}@cyberdyne.org"
    test_username = f"sarah_{uid}"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Register a new user
        reg_payload = {
            "email": test_email,
            "password": "SecurePassword123!",
            "full_name": "Sarah Connor",
            "username": test_username
        }
        res_reg = await client.post("/api/auth/register", json=reg_payload)
        assert res_reg.status_code == 200
        reg_data = res_reg.json()
        assert reg_data["status"] == "VERIFICATION_REQUIRED"
        assert "verify-email?token=" in reg_data.get("dev_verification_link", "")

        # Extract token from dev link
        dev_link = reg_data["dev_verification_link"]
        raw_token = dev_link.split("token=")[1].split("&")[0]

        # 2. Verify that unverified user CANNOT log in (Enforce email verification)
        login_unverified = await client.post("/api/auth/login", json={
            "username": test_email,
            "password": "SecurePassword123!"
        })
        assert login_unverified.status_code == 403
        assert "verification is required" in login_unverified.json()["detail"].lower()

        # 3. Verify email with valid token
        res_verify = await client.post("/api/auth/verify-email", json={"token": raw_token})
        assert res_verify.status_code == 200
        assert res_verify.json()["status"] == "EMAIL_VERIFIED"

        # 4. Consumed token must be rejected on replay
        res_replay = await client.post("/api/auth/verify-email", json={"token": raw_token})
        assert res_replay.status_code == 400

        # 5. Verified user can now log in successfully and receives session cookie
        login_res = await client.post("/api/auth/login", json={
            "username": test_email,
            "password": "SecurePassword123!"
        })
        assert login_res.status_code == 200
        login_data = login_res.json()
        assert login_data["status"] == "AUTHENTICATED"
        assert login_data["user"]["email"] == test_email
        assert login_data["user"]["email_verified"] is True
        assert "edupath_session" in login_res.cookies

        # 6. Forgot password & reset lifecycle
        forgot_res = await client.post("/api/auth/forgot-password", json={
            "email": test_email
        })
        assert forgot_res.status_code == 200
        reset_link = forgot_res.json().get("dev_reset_link")
        reset_token = reset_link.split("token=")[1].split("&")[0]

        # Reset password
        reset_res = await client.post("/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": "NewTerminatorPass456!"
        })
        assert reset_res.status_code == 200
        assert reset_res.json()["status"] == "PASSWORD_RESET_SUCCESS"

        # Old password must fail
        old_login = await client.post("/api/auth/login", json={
            "username": test_email,
            "password": "SecurePassword123!"
        })
        assert old_login.status_code == 401

        # New password must succeed
        new_login = await client.post("/api/auth/login", json={
            "username": test_email,
            "password": "NewTerminatorPass456!"
        })
        assert new_login.status_code == 200
        assert new_login.json()["status"] == "AUTHENTICATED"

        # 7. Demo single-click login for hackathon judges
        demo_res = await client.post("/api/auth/demo-login")
        assert demo_res.status_code == 200
        demo_data = demo_res.json()
        assert demo_data["status"] == "DEMO_AUTHENTICATED"
        assert demo_data["user"]["is_demo_user"] is True
        assert "edupath_session" in demo_res.cookies
