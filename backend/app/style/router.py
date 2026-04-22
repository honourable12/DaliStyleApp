from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()

@router.get("/recommendations")
def get_style_recommendations(occasion: str = "casual", db: Session = Depends(get_db)):
    return {"recommendations": []}

@router.post("/feedback")
def submit_style_feedback(recommendation_id: int, liked: bool, db: Session = Depends(get_db)):
    return {"message": "Feedback submitted"}
