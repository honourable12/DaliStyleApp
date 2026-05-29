import hashlib
from fastapi import Security, HTTPException, Depends
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from app.database import get_db
from app.wardrobe.models import Partner, PartnerApiKey
from starlette.status import HTTP_403_FORBIDDEN

API_KEY_NAME = "X-Partner-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


def _get_partner_from_key(api_key: str, db: Session):
    if not api_key:
        return None

    # Hash the provided key to compare with DB
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()

    # Find the active API key
    api_key_record = (
        db.query(PartnerApiKey)
        .filter(PartnerApiKey.key_hash == key_hash, PartnerApiKey.is_active)
        .first()
    )

    if not api_key_record:
        return None

    # Check if partner is active
    partner = (
        db.query(Partner)
        .filter(Partner.id == api_key_record.partner_id, Partner.is_active)
        .first()
    )

    if partner:
        # Inject the key record for logging purposes if needed
        partner._current_key = api_key_record
        return partner

    return None


def get_partner(
    api_key_header: str = Security(api_key_header), db: Session = Depends(get_db)
):
    partner = _get_partner_from_key(api_key_header, db)
    if not partner:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN, detail="Invalid or missing Partner API Key"
        )
    return partner


def get_optional_partner(
    api_key_header: str = Security(api_key_header), db: Session = Depends(get_db)
):
    return _get_partner_from_key(api_key_header, db)
