from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.core.logger import logger
from typing import Generator

# Check if we are using SQLite to configure check_same_thread
connect_args = {}
engine_kwargs = {"pool_pre_ping": True}
db_url = settings.DATABASE_URL

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    logger.warning("Using SQLite database for local execution fallback.")
else:
    logger.info("Initializing PostgreSQL database connections with connection pooling.")
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_recycle": 1800
    })

try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        **engine_kwargs
    )
    # Test connection immediately to trigger failure if DB is offline/paused
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("SELECT 1"))
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database engine established successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database engine: {e}")
    if not db_url.startswith("sqlite"):
        logger.warning("Falling back to local SQLite database due to PostgreSQL connection failure.")
        db_url = "sqlite:///./mymentor.db"
        connect_args = {"check_same_thread": False}
        engine_kwargs = {"pool_pre_ping": True}
        try:
            engine = create_engine(
                db_url,
                connect_args=connect_args,
                **engine_kwargs
            )
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            logger.info("Fallback SQLite database engine established successfully.")
        except Exception as se:
            logger.error(f"Failed to initialize fallback database engine: {se}")
            raise se
    else:
        raise e

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
