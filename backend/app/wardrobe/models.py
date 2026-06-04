import uuid
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    partner_id = Column(
        UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True
    )  # Linked to a brand
    skin_type = Column(String, nullable=True)
    style_persona = Column(String, default="Minimalist")
    metadata_skin = Column(JSON, nullable=True)

    items = relationship("ClothingItem", back_populates="owner")
    outfits = relationship("Outfit", back_populates="user")
    body_scans = relationship("BodyScan", back_populates="user", cascade="all, delete-orphan")


class BodyScan(Base):
    __tablename__ = "body_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    image_url = Column(String, nullable=False)
    body_mapping = Column(JSON, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="body_scans")


class Partner(Base):
    __tablename__ = "partners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    api_key = Column(
        String, unique=True, index=True
    )  # LEGACY: Keep for migration, remove later
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    usage_logs = relationship("ApiUsage", back_populates="partner")
    api_keys = relationship(
        "PartnerApiKey", back_populates="partner", cascade="all, delete-orphan"
    )


class PartnerApiKey(Base):
    __tablename__ = "partner_api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), index=True)
    key_hash = Column(String, unique=True, index=True, nullable=False)
    key_prefix = Column(String, nullable=False)  # e.g. "ds_live_"
    name = Column(String, nullable=False)  # e.g. "Production Main"
    type = Column(String, default="production")  # production | sandbox
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), nullable=True)

    partner = relationship("Partner", back_populates="api_keys")
    usage_logs = relationship("ApiUsage", back_populates="api_key")


class ApiUsage(Base):
    __tablename__ = "api_usage"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), index=True)
    api_key_id = Column(
        UUID(as_uuid=True), ForeignKey("partner_api_keys.id"), index=True, nullable=True
    )
    endpoint = Column(String)  # e.g. "/style/engine/look"
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    partner = relationship("Partner", back_populates="usage_logs")
    api_key = relationship("PartnerApiKey", back_populates="usage_logs")


class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    pattern = Column(String, nullable=True)
    color_primary = Column(String)
    color_secondary = Column(String, nullable=True)
    image_url = Column(String)
    is_favourite = Column(Boolean, default=False)
    
    # New Digital Vault Fields
    brand = Column(String, nullable=True)
    material = Column(String, nullable=True)
    sustainability_score = Column(Integer, default=0)
    season = Column(String, default="All-Season")  # Spring, Summer, Autumn, Winter, All-Season
    occasion_tags = Column(JSON, default=list)  # ["Work", "Casual", etc.]
    purchase_date = Column(DateTime(timezone=True), nullable=True)

    partner_id = Column(
        UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True
    )

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    owner = relationship("User", back_populates="items")

    metadata_ai = Column(JSON, nullable=True)


class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    partner_id = Column(
        UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True
    )
    occasion = Column(String, index=True)
    clothing_ids = Column(JSON)
    llm_reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="outfits")
