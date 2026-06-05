import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set testing environment variable BEFORE imports
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["TESTING"] = "True"

from app.database import Base, get_db
from main import app as fastapi_app

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
    engine.dispose() # Ensure connections are closed
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except PermissionError:
            pass


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

    def session_factory():
        return db

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


@pytest.fixture
def test_user(db):
    from app.wardrobe.models import User
    from app.auth.utils import get_password_hash
    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        skin_type="MST-5"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_headers(client):
    response = client.post(
        "/api/auth/login",
        data={"username": "test@example.com", "password": "password123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
