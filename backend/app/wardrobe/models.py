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
    skin_type = Column(String, nullable=True)
    style_persona = Column(String, default="Minimalist") #inimalist | Bold | Old Money
    metadata_skin = Column(JSON, nullable=True)

    items = relationship("ClothingItem", back_populates="owner")
    outfits = relationship("Outfit", back_populates="user")

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    color_primary = Column(String)
    color_secondary = Column(String, nullable=True)
    image_url = Column(String)
    is_favourite = Column(Boolean, default=False)

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    owner = relationship("User", back_populates="items")
    
    metadata_ai = Column(JSON, nullable=True)

class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Updated to UUID foreign key
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    occasion = Column(String)
    clothing_ids = Column(JSON)
    llm_reason = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="outfits")
