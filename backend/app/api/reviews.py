import os
import json
import base64
import shutil
import tempfile
import subprocess
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database.database import get_db
from app.models.user import User
from app.models.review import Review
from app.schemas.review import ReviewResponse
from app.services.pdf_parser import extract_text_from_pdf
from app.services.llm import analyze_resume_with_ai, rewrite_resume_json, chat_with_resume
from app.services.resume_builder import ResumeData, build_latex_from_schema, apply_partial_updates
from app.auth.security import settings

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/analyze", response_model=ReviewResponse)
async def analyze_resume(
    job_title: str = Form(...),
    job_description: str = Form(...),
    resume: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not resume.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
    if current_user.subscription_tier == "free" and (current_user.usage_count or 0) >= 3:
        raise HTTPException(
            status_code=403, 
            detail="You have reached your free tier limit of 3 analyses. Please upgrade to Pro."
        )
        
    try:
        # Read PDF bytes
        file_bytes = await resume.read()
        
        # Extract Text
        resume_text = extract_text_from_pdf(file_bytes)
        if not resume_text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
            
        # Analyze with AI (Groq or Gemini)
        analysis_result = analyze_resume_with_ai(resume_text, job_description)
        
        # Save to DB
        new_review = Review(
            user_id=current_user.id,
            job_title=job_title,
            job_description=job_description,
            resume_text=resume_text,
            score=analysis_result.get("score"),
            feedback_json=json.dumps(analysis_result)
        )
        db.add(new_review)
        
        # Increment usage count for the user
        current_user.usage_count = (current_user.usage_count or 0) + 1
        
        db.commit()
        db.refresh(new_review)
        
        return new_review
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[ReviewResponse])
def get_user_reviews(
    skip: int = 0, 
    limit: int = 100, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).filter(Review.user_id == current_user.id).order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return reviews


@router.post("/{review_id}/rewrite")
def rewrite_resume(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if user is PRO
    if current_user.subscription_tier != "pro":
        raise HTTPException(
            status_code=403,
            detail="Resume rewriting is a Pro feature. Please upgrade your plan."
        )

    # Fetch the review
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if not review.resume_text or not review.job_description:
        raise HTTPException(status_code=400, detail="Review is missing original resume text or job description")

    try:
        feedback_data = json.loads(review.feedback_json or '{}')
        
        # Check if we already have the LaTeX code generated from a previous rewrite
        latex_code = feedback_data.get("latex_code")
        
        if not latex_code or "resume_data" not in feedback_data:
            resume_data_dict = rewrite_resume_json(review.resume_text, review.job_description)
            resume_data = ResumeData(**resume_data_dict)
            latex_code = build_latex_from_schema(resume_data)
            
            feedback_data["latex_code"] = latex_code
            feedback_data["resume_data"] = resume_data_dict
            review.feedback_json = json.dumps(feedback_data)
            db.commit()
            
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = os.path.join(temp_dir, "resume.tex")
            pdf_path = os.path.join(temp_dir, "resume.pdf")
            
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_code)
                
            process = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            
            out_pdf = f"/tmp/rewritten_resume_{review.id}.pdf"
            
            if os.path.exists(pdf_path):
                shutil.copy(pdf_path, out_pdf)
            else:
                print(f"LaTeX Compilation Error:\n{process.stdout}\n{process.stderr}")
                raise Exception("LaTeX compilation failed due to formatting errors generated by the AI.")
            
            return FileResponse(
                path=out_pdf,
                filename="Optimized_Resume.pdf",
                media_type="application/pdf"
            )

    except Exception as e:
        print(f"Rewrite Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{review_id}", response_model=ReviewResponse)
def get_single_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@router.post("/{review_id}/chat")
def chat_and_modify(
    review_id: int,
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.subscription_tier != "pro":
        raise HTTPException(status_code=403, detail="Chat functionality is a Pro feature.")

    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    try:
        feedback_data = json.loads(review.feedback_json or '{}')
        current_resume_dict = feedback_data.get("resume_data")
        if not current_resume_dict:
            raise Exception("No resume data found for this review. Please generate the resume first.")
            
        current_resume_json_str = json.dumps(current_resume_dict)

        result = chat_with_resume(current_resume_json_str, review.job_description, request.message)
        chat_response = result.get("chat_response") or ""
        updates = result.get("updates", {})
        
        # Apply partial updates to the existing state
        updated_resume_dict = apply_partial_updates(current_resume_dict, updates)
        
        resume_data = ResumeData(**updated_resume_dict)
        latex_code = build_latex_from_schema(resume_data)

        # Compile PDF
        out_pdf = f"/tmp/rewritten_resume_{review.id}.pdf"
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_path = os.path.join(temp_dir, "resume.tex")
            pdf_path = os.path.join(temp_dir, "resume.pdf")
            
            with open(tex_path, "w", encoding="utf-8") as f:
                f.write(latex_code)
                
            process = subprocess.run(
                ["pdflatex", "-interaction=nonstopmode", "-output-directory", temp_dir, tex_path],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            
            if os.path.exists(pdf_path):
                shutil.copy(pdf_path, out_pdf)
                
                # Save successfully compiled new latex code and state
                feedback_data = json.loads(review.feedback_json or '{}')
                feedback_data["latex_code"] = latex_code
                feedback_data["resume_data"] = updated_resume_dict
                review.feedback_json = json.dumps(feedback_data)
                db.commit()
            else:
                print(f"LaTeX Compilation Error:\n{process.stdout}\n{process.stderr}")
                raise Exception("The AI generated invalid formatting. Please try rephrasing your request.")

        # Return PDF base64 encoded for easier parsing in the frontend
        with open(out_pdf, "rb") as f:
            pdf_bytes = f.read()
            pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
            
        return {
            "chat_response": chat_response,
            "pdf_base64": pdf_b64
        }

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
