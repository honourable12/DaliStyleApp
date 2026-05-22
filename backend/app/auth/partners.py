from fastapi import Security, HTTPException, Depends
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from app.database import get_db
from app.wardrobe.models import Partner
from starlette.status import HTTP_403_FORBIDDEN

API_KEY_NAME = "X-Partner-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_partner(
    api_key_header: str = Security(api_key_header),
    db: Session = Depends(get_db)
):
    if not api_key_header:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Partner API Key missing"
        )
    
    partner = db.query(Partner).filter(Partner.api_key == api_key_header, Partner.is_active == True).first()
    if not partner:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Invalid Partner API Key"
        )
    return partner
