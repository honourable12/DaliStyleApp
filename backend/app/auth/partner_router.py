import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.utils import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    settings,
    verify_password,
)
from app.database import get_db
from app.wardrobe.models import ApiUsage, Partner, PartnerApiKey

router = APIRouter(prefix="/auth/partner", tags=["partner-auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/partner/login")


class PartnerRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class PartnerSettings(BaseModel):
    mode: str  # managed | hybrid | headless
    category_boost: Optional[Dict[str, float]] = None
    external_db: Optional[Dict[str, str]] = None  # url, key for hybrid
    assets: Optional[Dict[str, str]] = None  # s3 bucket for managed


class PartnerResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    api_key: str
    is_active: bool
    settings: Optional[Dict] = None
    model_config = {"from_attributes": True}


class PartnerUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[PartnerSettings] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class ApiKeyResponse(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    type: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class ApiKeyCreate(BaseModel):
    name: str
    type: str = "production"  # production | sandbox


class ApiKeyCreatedResponse(ApiKeyResponse):
    api_key: str  # The plaintext key, only shown once


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


async def get_current_partner(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> Partner:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate partner credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token, expected_type="access")
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "partner":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    partner = db.query(Partner).filter(Partner.email == email).first()
    if partner is None:
        raise credentials_exception
    return partner


@router.post("/register", response_model=PartnerResponse)
def register_partner(partner_in: PartnerRegister, db: Session = Depends(get_db)):
    if len(partner_in.password) < 8:
        raise HTTPException(status_code=422, detail="Password too short")

    existing = (
        db.query(Partner).filter(Partner.email == partner_in.email.lower()).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    api_key = f"ds_live_{secrets.token_urlsafe(32)}"

    new_partner = Partner(
        name=partner_in.name,
        email=partner_in.email.lower(),
        hashed_password=get_password_hash(partner_in.password),
        api_key=api_key,
        settings={"mode": "headless"},
    )
    db.add(new_partner)
    db.commit()
    db.refresh(new_partner)
    return new_partner


@router.post("/login", response_model=Token)
def login_partner(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    partner = (
        db.query(Partner).filter(Partner.email == form_data.username.lower()).first()
    )
    if not partner or not verify_password(form_data.password, partner.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": partner.email, "role": "partner"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(data={"sub": partner.email, "role": "partner"})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=PartnerResponse)
def get_partner_me(current_partner: Partner = Depends(get_current_partner)):
    return current_partner


@router.patch("/settings", response_model=PartnerResponse)
def update_partner_settings(
    update_data: PartnerUpdate,
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    if update_data.name:
        current_partner.name = update_data.name

    if update_data.settings:
        existing_settings = current_partner.settings or {}
        # Update with new settings fields
        new_settings_data = update_data.settings.model_dump(exclude_unset=True)
        existing_settings.update(new_settings_data)
        current_partner.settings = existing_settings

    db.commit()
    db.refresh(current_partner)
    return current_partner


@router.post("/regen-key", response_model=PartnerResponse)
def regenerate_api_key(
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    new_key = f"ds_live_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(new_key.encode()).hexdigest()

    new_api_key = PartnerApiKey(
        partner_id=current_partner.id,
        key_hash=key_hash,
        key_prefix=new_key[:8],
        name="Regenerated Key",
        type="production",
    )
    db.add(new_api_key)

    current_partner.api_key = new_key

    db.commit()
    db.refresh(current_partner)
    return current_partner


@router.get("/keys", response_model=List[ApiKeyResponse])
def list_api_keys(
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    return (
        db.query(PartnerApiKey)
        .filter(PartnerApiKey.partner_id == current_partner.id)
        .all()
    )


@router.post("/keys", response_model=ApiKeyCreatedResponse)
def create_api_key(
    key_in: ApiKeyCreate,
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    prefix = "ds_live_" if key_in.type == "production" else "ds_test_"
    raw_key = f"{prefix}{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    new_key = PartnerApiKey(
        partner_id=current_partner.id,
        key_hash=key_hash,
        key_prefix=raw_key[:8],
        name=key_in.name,
        type=key_in.type,
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)

    # Manually construct the response to include the one-time plaintext key
    base_data = ApiKeyResponse.model_validate(new_key).model_dump()
    return ApiKeyCreatedResponse(**base_data, api_key=raw_key)


@router.patch("/keys/{key_id}", response_model=ApiKeyResponse)
def toggle_api_key(
    key_id: UUID,
    is_active: bool,
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    key = (
        db.query(PartnerApiKey)
        .filter(
            PartnerApiKey.id == key_id, PartnerApiKey.partner_id == current_partner.id
        )
        .first()
    )

    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")

    key.is_active = is_active
    db.commit()
    db.refresh(key)
    return key


@router.delete("/keys/{key_id}")
def delete_api_key(
    key_id: UUID,
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    key = (
        db.query(PartnerApiKey)
        .filter(
            PartnerApiKey.id == key_id, PartnerApiKey.partner_id == current_partner.id
        )
        .first()
    )

    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")

    db.delete(key)
    db.commit()
    return {"message": "API Key deleted"}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    partner = db.query(Partner).filter(Partner.email == body.email.lower()).first()

    if partner:
        reset_token = create_password_reset_token(
            data={"sub": partner.email, "role": "partner"}
        )
        # FOR TESTING
        print(" PARTNER PASSWORD RESET REQUEST")
        print(
            f"Link: http://localhost:3000/developer/reset-password?token={reset_token}"
        )

    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(body.token, expected_type="reset")
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "partner":
            raise HTTPException(status_code=400, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(
            status_code=400, detail="Reset token has expired or is invalid"
        )

    partner = db.query(Partner).filter(Partner.email == email).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    partner.hashed_password = get_password_hash(body.new_password)
    db.commit()

    return {"message": "Password updated successfully. You can now sign in."}


@router.get("/analytics")
def get_partner_analytics(
    current_partner: Partner = Depends(get_current_partner),
    db: Session = Depends(get_db),
):
    total_requests = (
        db.query(ApiUsage).filter(ApiUsage.partner_id == current_partner.id).count()
    )

    avg_latency = (
        db.query(func.avg(ApiUsage.response_time_ms))
        .filter(ApiUsage.partner_id == current_partner.id)
        .scalar()
        or 0
    )

    error_rate = 0
    if total_requests > 0:
        errors = (
            db.query(ApiUsage)
            .filter(
                ApiUsage.partner_id == current_partner.id, ApiUsage.status_code >= 400
            )
            .count()
        )
        error_rate = round((errors / total_requests) * 100, 2)

    return {
        "total_requests": total_requests,
        "average_latency_ms": round(float(avg_latency), 2),
        "error_rate_percent": error_rate,
    }
