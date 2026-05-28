import os
import time
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import NullPool

# Standard logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- DATABASE CONFIGURATION ---
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./daily_style.db")

def get_engine():
    retries = 5 
    while retries > 0:
        try:
            if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
                engine = create_engine(
                    SQLALCHEMY_DATABASE_URL,
                    connect_args={"check_same_thread": False}
                )
                logger.info(f" Using SQLite Database: {SQLALCHEMY_DATABASE_URL}")
            else:
                engine = create_engine(
                    SQLALCHEMY_DATABASE_URL,
                    poolclass=NullPool,
                    pool_pre_ping=True
                )
                # Test connection
                with engine.connect() as conn:
                    pass
                logger.info(f" Using Production Database: {SQLALCHEMY_DATABASE_URL.split('@')[-1]}")
            return engine
        except OperationalError as e:
            retries -= 1
            logger.info(f" Database not ready ({retries} retries left)...")
            time.sleep(1)
    raise Exception("Could not connect to database after several retries")

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
