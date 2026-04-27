from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    skin_type = Column(String, nullable=True)
    metadata_skin = Column(JSON, nullable=True)

    items = relationship("ClothingItem", back_populates="owner")

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String)
    color_primary = Column(String)
    color_secondary = Column(String, nullable=True)
    image_url = Column(String)
    is_favourite = Column(Boolean, default=False)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="items")

    metadata_ai = Column(JSON, nullable=True)
