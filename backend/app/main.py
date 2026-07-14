from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth
from app.api import reviews
from app.api import stripe

app = FastAPI(
    title="ResumeX API",
    description="Backend API for ResumeX platform",
    version="0.1.0",
)

import os

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
app.include_router(stripe.router, prefix="/stripe", tags=["stripe"])

@app.get("/")
async def root():
    return {"message": "Welcome to ResumeX API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
