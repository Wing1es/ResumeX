from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FeedbackItem(BaseModel):
    category: str
    comments: str
    suggestions: str

class ReviewResult(BaseModel):
    score: float
    summary: str
    pros: List[str]
    cons: List[str]
    detailed_feedback: List[FeedbackItem]

class ReviewCreate(BaseModel):
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    # We won't send resume_text in the JSON body, it will come from the PDF upload

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    job_title: Optional[str]
    score: Optional[float]
    feedback_json: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
