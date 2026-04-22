from fastapi import FastAPI
from app.auth.router import router as auth_router
from app.database import engine, Base

# Create tables in the database (this will be replaced by alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Daily Style Fashion API")

app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Daily Style Fashion API"}
