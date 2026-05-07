from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# --- DATABASE CONFIGURATION ---
# Set this to False if you want to switch back to Postgres
USE_SQLITE = True 

if USE_SQLITE:
    # Use a local file in the backend directory
    SQLALCHEMY_DATABASE_URL = "sqlite:///./daily_style.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False} # Required for SQLite + FastAPI
    )
    print(f"📡 Using Temporal Database: {SQLALCHEMY_DATABASE_URL}")
else:
    # PostgreSQL Configuration (for Docker/Production)
    DB_HOST = os.getenv("DB_HOST", "db")
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASS = os.getenv("DB_PASS", "password")
    DB_NAME = os.getenv("DB_NAME", "daily_style")
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:5432/{DB_NAME}"
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
