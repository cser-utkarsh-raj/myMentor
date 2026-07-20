from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.core.logger import logger
from typing import Generator

# Check if we are using SQLite to configure check_same_thread
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    logger.warning("Using SQLite database for local execution fallback.")
else:
    logger.info("Initializing PostgreSQL database connections.")

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True  # Important for PostgreSQL to check connection health
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine established successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    raise e

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
