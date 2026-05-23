import uuid
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True) # Linked to a brand
    skin_type = Column(String, nullable=True)
    style_persona = Column(String, default="Minimalist")
    metadata_skin = Column(JSON, nullable=True)

    items = relationship("ClothingItem", back_populates="owner")
    outfits = relationship("Outfit", back_populates="user")

class Partner(Base):
    __tablename__ = "partners"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True) 
    hashed_password = Column(String, nullable=True)
    api_key = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    usage_logs = relationship("ApiUsage", back_populates="partner")

class ApiUsage(Base):
    __tablename__ = "api_usage"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), index=True)
    endpoint = Column(String) # e.g. "/style/engine/look"
    status_code = Column(Integer)
    response_time_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    partner = relationship("Partner", back_populates="usage_logs")

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    color_primary = Column(String)
    color_secondary = Column(String, nullable=True)
    image_url = Column(String)
    is_favourite = Column(Boolean, default=False)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    owner = relationship("User", back_populates="items")
    
    metadata_ai = Column(JSON, nullable=True)

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    partner_id = Column(UUID(as_uuid=True), ForeignKey("partners.id"), nullable=True, index=True)
    occasion = Column(String, index=True)
    clothing_ids = Column(JSON)
    llm_reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="outfits")
