import os
import json
import google.generativeai as genai
from typing import Dict, Any
from groq import Groq

def analyze_resume_with_ai(resume_text: str, job_description: str) -> Dict[str, Any]:
    """
    Analyzes a resume against a job description using Groq (llama-3.3-70b-versatile) or Gemini fallback.
    Returns structured JSON.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) and senior technical recruiter.
    Analyze the following resume against the provided job description.
    
    Job Description:
    {job_description}
    
    Resume:
    {resume_text}
    
    Provide your analysis as a structured JSON object with the following exact keys and format:
    {{
        "score": 85.5,
        "ats_score": 92.0,
        "summary": "A 2-3 sentence overview of the candidate's fit.",
        "pros": ["Strong point 1", "Strong point 2"],
        "cons": ["Weakness 1", "Missing skill 2"],
        "section_annotations": [
            {{
                "section": "Professional Summary",
                "status": "red",
                "note": "What's wrong or missing"
            }},
            {{
                "section": "Work Experience",
                "status": "green",
                "note": "Why this is strong"
            }}
        ],
        "detailed_feedback": [
            {{
                "category": "Skills Match",
                "comments": "Detailed analysis of skills.",
                "suggestions": "What to add or improve."
            }}
        ]
    }}
    
    Return ONLY valid JSON, without any markdown blocks or extra text.
    """

    response_text = ""

    if groq_api_key:
        client = Groq(api_key=groq_api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        response_text = chat_completion.choices[0].message.content
    elif gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text
    else:
        raise ValueError("Neither GROQ_API_KEY nor GEMINI_API_KEY is set in the environment variables.")
        
    try:
        response_text = response_text.strip()
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
            
        return json.loads(response_text)
    except Exception as e:
        print(f"AI API Error: {e}")
        raise e


def rewrite_resume_json(resume_text: str, job_description: str) -> dict:
    """
    Rewrites the resume text to target the job description.
    Returns a dictionary matching the ResumeData Pydantic schema.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    prompt = f"""
    You are an expert resume writer and ATS specialist.
    Rewrite the following resume to perfectly target the given job description.
    Keep all truthful facts, but rephrase bullets to highlight relevant skills and keywords from the job description.
    CRITICAL: Maintain the full length and detail of the original resume. Do NOT summarize or leave out bullet points. Expand and improve the wording without making it shorter.
    
    You must format the rewritten resume STRICTLY as a JSON object matching this schema:
    {{
        "name": "Candidate Name",
        "contact_info": "Email | Phone | Location | LinkedIn",
        "summary": "Professional summary paragraph...",
        "sections": [
            {{
                "section_title": "EXPERIENCE",
                "items": [
                    {{
                        "title": "Company Name",
                        "subtitle": "Job Title",
                        "date": "Date -- Date",
                        "location": "Location",
                        "bullets": ["Bullet 1", "Bullet 2"]
                    }}
                ]
            }},
            {{
                "section_title": "SKILLS",
                "items": [
                    {{
                        "title": "Category Name",
                        "bullets": ["Skill 1", "Skill 2"]
                    }}
                ]
            }}
        ]
    }}
    
    Guidelines:
    1. Organize the resume into logical sections (e.g., EXPERIENCE, EDUCATION, PROJECTS, SKILLS, PUBLICATIONS).
    2. Ensure all original content is preserved and mapped into the appropriate section.
    3. Return ONLY valid JSON. Do not include markdown code blocks.
    
    Job Description:
    {job_description}
    
    Original Resume:
    {resume_text}
    """

    response_text = ""

    if groq_api_key:
        client = Groq(api_key=groq_api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        response_text = chat_completion.choices[0].message.content
    elif gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text
    else:
        raise ValueError("Neither GROQ_API_KEY nor GEMINI_API_KEY is set in the environment variables.")

    response_text = response_text.strip()
    if response_text.startswith('```json'):
        response_text = response_text[7:]
    elif response_text.startswith('```'):
        response_text = response_text[3:]
    if response_text.endswith('```'):
        response_text = response_text[:-3]
        
    return json.loads(response_text.strip())


def chat_with_resume(current_resume_json: str, job_description: str, user_message: str) -> dict:
    """
    Chat interface for iterative resume improvement using Partial Updates.
    Returns the AI's conversational response and an object containing only the fields/sections that changed.
    """
    groq_api_key = os.getenv("GROQ_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    prompt = f"""
    You are an expert resume coach helping a user improve their resume for a specific job.
    You have access to the CURRENT state of their resume in JSON format and the target job description.
    
    Job Description:
    {job_description}
    
    Current Resume JSON:
    {current_resume_json}
    
    User Request: {user_message}
    
    Based on the user's request, provide a helpful conversational response.
    Additionally, output a PARTIAL UPDATE object containing ONLY the fields or sections you want to modify.
    
    CRITICAL INSTRUCTION: Do NOT output the entire resume unless everything changed. Only output the specific sections that need to change. The system will merge your updates into the existing resume.
    
    Format the JSON output EXACTLY matching this schema:
    {{
        "chat_response": "Your conversational reply here...",
        "updates": {{
            // ONLY include fields you want to change. Omit fields that remain the same.
            "name": "Updated Name", // optional
            "contact_info": "Updated Contact Info", // optional
            "summary": "Updated summary...", // optional
            "sections": [ // optional: ONLY include sections that were modified or added
                {{
                    "section_title": "EXPERIENCE",
                    "items": [
                        {{
                            "title": "Company Name",
                            "subtitle": "Job Title",
                            "date": "Date -- Date",
                            "location": "Location",
                            "bullets": ["Updated Bullet 1", "Updated Bullet 2"]
                        }}
                    ]
                }}
            ],
            "section_order": ["SUMMARY", "EXPERIENCE", "PROJECTS", "SKILLS"] // optional: Include ONLY if the user explicitly asks to reorder or move a section.
        }}
    }}
    
    Guidelines:
    1. For `sections`, if you include a section (e.g. "EXPERIENCE"), you MUST provide all of its items. The system will completely replace the old "EXPERIENCE" section with your new one.
    2. Do not include untouched sections in the `updates.sections` array.
    3. If the user asks to move or reorder sections, provide a `section_order` array listing the section titles in the new order.
    
    Return ONLY valid JSON. Do not include markdown code blocks.
    """

    response_text = ""

    if groq_api_key:
        client = Groq(api_key=groq_api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        response_text = chat_completion.choices[0].message.content
    elif gemini_api_key:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        response_text = response.text
    else:
        raise ValueError("Neither GROQ_API_KEY nor GEMINI_API_KEY is set in the environment variables.")

    response_text = response_text.strip()
    if response_text.startswith('```json'):
        response_text = response_text[7:]
    if response_text.endswith('```'):
        response_text = response_text[:-3]
        
    return json.loads(response_text.strip())

