"""
Database Connection Configuration
Supports PostgreSQL (production) and SQLite (development fallback)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager

# Database URL from environment or default to SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Use SQLite as fallback for development
if not DATABASE_URL or DATABASE_URL.startswith("postgresql://"):
    try:
        # Try PostgreSQL first
        if DATABASE_URL:
            test_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
            with test_engine.connect() as conn:
                pass  # Connection successful
            USE_SQLITE = False
        else:
            USE_SQLITE = True
    except Exception:
        USE_SQLITE = True
        print("PostgreSQL not available, using SQLite for development")
else:
    USE_SQLITE = False

if USE_SQLITE:
    # SQLite for development
    DATABASE_URL = "sqlite:///./superbowl_analytics.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    # PostgreSQL for production
    if not DATABASE_URL:
        DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/superbowl_analytics"
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        echo=False,
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from .models import Base
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
