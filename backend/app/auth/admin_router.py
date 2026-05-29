import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict

from app.database import get_db
from app.wardrobe.models import Partner

router = APIRouter(prefix="/admin/partners", tags=["admin"])


class PartnerCreate(BaseModel):
    name: str
    settings: Optional[Dict] = None


class PartnerResponse(BaseModel):
    id: uuid.UUID
    name: str
    api_key: str
    is_active: bool


@router.post("/", response_model=PartnerResponse)
def create_partner(req: PartnerCreate, db: Session = Depends(get_db)):
    # Check if partner name exists
    existing = db.query(Partner).filter(Partner.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Partner name already exists")

    # Generate a secure random API Key
    # format: ds_live_... for a professional look
    api_key = f"ds_live_{secrets.token_urlsafe(32)}"

    new_partner = Partner(name=req.name, api_key=api_key, settings=req.settings or {})

    db.add(new_partner)
    db.commit()
    db.refresh(new_partner)

    return new_partner
