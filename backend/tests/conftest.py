import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set testing environment variable BEFORE imports
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.database import Base, get_db
from app.main import app as fastapi_app

# Create test engine
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables after session
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    import app.auth.middleware
    import app.database

    # Override SessionLocal so middleware uses the same session as the test
    original_db_session_local = app.database.SessionLocal
    original_middleware_session_local = app.auth.middleware.SessionLocal

    session_factory = lambda: db
    app.database.SessionLocal = session_factory
    app.auth.middleware.SessionLocal = session_factory

    def override_get_db():
        try:
            yield db
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as c:
        yield c

    fastapi_app.dependency_overrides.clear()
    app.database.SessionLocal = original_db_session_local
    app.auth.middleware.SessionLocal = original_middleware_session_local
