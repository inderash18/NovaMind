import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from backend.config.settings import settings

logger = logging.getLogger("aetheros.memory.persistence.db_session")

# SQLAlchemy Base class shared across all persistence tables
Base = declarative_base()

DATABASE_URL = settings.DATABASE_URL
engine_args = {}

# Handle sqlite specific connection pools and thread options
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

# Setup primary async database engine
try:
    logger.info(f"Connecting database engine using connection: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    async_engine = create_async_engine(DATABASE_URL, echo=False, future=True, **engine_args)
except Exception as e:
    logger.warning(f"Failed to initialize primary database connection: {e}. Falling back to SQLite local database.")
    # Fallback to absolute local SQLite file
    FALLBACK_URL = "sqlite+aiosqlite:///./aetheros.db"
    async_engine = create_async_engine(FALLBACK_URL, echo=False, future=True, connect_args={"check_same_thread": False})

# Create asynchronous sessionmaker pool
async_session_maker = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding database connections cleanly.
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session rolled back due to error: {e}")
            raise
        finally:
            await session.close()

async def init_db() -> None:
    """
    Bootstraps persistent tables in local environments if they do not exist.
    """
    try:
        async with async_engine.begin() as conn:
            # Create all metadata-registered tables
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schemas initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to bootstrap database schemas: {e}")
        raise
