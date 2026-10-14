import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from backend.app.config.settings import settings

logger = logging.getLogger("edupath.database")

# Ensure parent directory exists for SQLite
if "sqlite" in settings.DATABASE_URL:
    db_file_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    db_dir = os.path.dirname(db_file_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db() -> None:
    """Idempotently create all tables and apply non-destructive schema migrations."""
    # Import all models here so that Base.metadata has all table definitions
    from backend.app.models import entities  # noqa: F401
    async with engine.begin() as conn:
        logger.info("Verifying and initializing all database tables...")
        await conn.run_sync(Base.metadata.create_all)

        # Safe non-destructive column migrations for SQLite / existing databases
        if "sqlite" in settings.DATABASE_URL:
            def migrate_sqlite_columns(connection):
                try:
                    cursor = connection.connection.cursor()
                    cursor.execute("PRAGMA table_info(users)")
                    columns = [col[1] for col in cursor.fetchall()]
                    if "email_verified_at" not in columns:
                        cursor.execute("ALTER TABLE users ADD COLUMN email_verified_at DATETIME")
                    if "account_status" not in columns:
                        cursor.execute("ALTER TABLE users ADD COLUMN account_status VARCHAR(32) DEFAULT 'ACTIVE'")
                    if "last_login_at" not in columns:
                        cursor.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME")
                except Exception as mig_err:
                    logger.warning(f"SQLite migration notice: {mig_err}")

            await conn.run_sync(migrate_sqlite_columns)

        logger.info("Database tables initialized successfully.")
