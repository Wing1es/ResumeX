from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Inputs
    job_title = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=False)
    
    # AI Outputs (storing as JSON string or Text)
    score = Column(Float, nullable=True)
    feedback_json = Column(Text, nullable=True) # Will store the raw JSON from Gemini
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="reviews")
