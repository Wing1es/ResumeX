from pydantic import BaseModel, Field, model_validator
from typing import List, Optional, Any

class SectionItem(BaseModel):
    title: str = Field(default="", description="Name of the entry (e.g., Company, University, Project, Skill Category)")
    subtitle: str = Field(default="", description="Subtitle (e.g., Job Title, Degree, Technologies)")
    date: str = Field(default="", description="Date or Date Range")
    location: str = Field(default="", description="Location if applicable")
    bullets: List[str] = Field(default_factory=list, description="Bullet points for experience/projects/education, or a list of individual skills for a skill category")

    @model_validator(mode='before')
    @classmethod
    def parse_string_to_item(cls, data: Any) -> Any:
        if isinstance(data, str):
            return {"title": "", "bullets": [data]}
        return data

class ResumeSection(BaseModel):
    section_title: str = Field(description="Title of the section (e.g., EXPERIENCE, EDUCATION, SKILLS, PROJECTS, VOLUNTEERING, PUBLICATIONS)")
    items: List[SectionItem] = Field(default_factory=list)

class ResumeData(BaseModel):
    name: str = Field(description="Full Name")
    contact_info: str = Field(description="Contact line (e.g., Email | Phone | LinkedIn | GitHub)")
    summary: str = Field(default="", description="Professional summary paragraph")
    sections: List[ResumeSection] = Field(default_factory=list, description="All sections of the resume")


def apply_partial_updates(current_data: dict, updates: dict) -> dict:
    """
    Merges partial updates from the AI into the existing resume JSON data.
    """
    if not updates:
        return current_data
        
    if "name" in updates:
        current_data["name"] = updates["name"]
    if "contact_info" in updates:
        current_data["contact_info"] = updates["contact_info"]
    if "summary" in updates:
        current_data["summary"] = updates["summary"]
        
    if "sections" in updates:
        existing_sections = {s["section_title"].upper(): i for i, s in enumerate(current_data.get("sections", []))}
        
        for updated_sec in updates["sections"]:
            title = updated_sec.get("section_title", "").upper()
            if title in existing_sections:
                idx = existing_sections[title]
                current_data["sections"][idx] = updated_sec
            else:
                current_data["sections"].append(updated_sec)
                existing_sections[title] = len(current_data["sections"]) - 1
                
    if "section_order" in updates:
        order_map = {title.upper(): i for i, title in enumerate(updates["section_order"])}
        
        def get_sort_key(sec):
            title = sec.get("section_title", "").upper()
            return order_map.get(title, 999)
            
        current_data.get("sections", []).sort(key=get_sort_key)
        
    return current_data

def escape_latex(text: str) -> str:
    """
    Escapes special LaTeX characters to prevent compilation errors.
    """
    if not text:
        return ""
    
    # Characters that need escaping in LaTeX
    special_chars = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
        '\\': r'\textbackslash{}'
    }
    
    result = []
    for char in text:
        if char in special_chars:
            result.append(special_chars[char])
        else:
            result.append(char)
            
    return "".join(result)


def build_latex_from_schema(data: ResumeData) -> str:
    """
    Renders the structured Pydantic data into a valid LaTeX document.
    """
    latex = [
        r"\documentclass[10pt,a4paper]{article}",
        r"\usepackage[margin=0.75in]{geometry}",
        r"\usepackage{hyperref}",
        r"\usepackage{enumitem}",
        r"\usepackage{titlesec}",
        r"\titleformat{\section}{\large\bfseries\uppercase}{}{0em}{}[\titlerule]",
        r"\titlespacing{\section}{0pt}{12pt}{8pt}",
        r"\setlist[itemize]{leftmargin=*, nosep, itemsep=3pt}",
        r"\begin{document}",
        r"\pagestyle{empty}",
        r"\begin{center}",
        rf"{{\LARGE \textbf{{{escape_latex(data.name)}}}}} \\ \vspace{{4pt}}",
        escape_latex(data.contact_info),
        r"\end{center}"
    ]

    if data.summary:
        latex.append(r"\section*{Professional Summary}")
        latex.append(escape_latex(data.summary))

    for section in data.sections:
        latex.append(rf"\section*{{{escape_latex(section.section_title)}}}")
        
        is_skills = "skill" in section.section_title.lower()
        
        for item in section.items:
            if is_skills:
                # Format skills as: \textbf{Category:} Skill 1, Skill 2
                title = rf"\textbf{{{escape_latex(item.title)}}}: " if item.title else ""
                skills_str = escape_latex(", ".join(item.bullets))
                latex.append(rf"{title}{skills_str} \\")
            else:
                # Format generic items (Experience, Projects, Education)
                # Line 1: Title (left) and Location or Date (right)
                left_1 = rf"\textbf{{{escape_latex(item.title)}}}" if item.title else ""
                right_1 = rf"\textbf{{{escape_latex(item.location)}}}" if item.location else (rf"\textbf{{{escape_latex(item.date)}}}" if item.date and not item.subtitle else "")
                
                line_1 = rf"{left_1} \hfill {right_1}" if right_1 else left_1
                if line_1:
                    latex.append(r"\noindent")
                    latex.append(line_1 + r" \\")
                
                # Line 2: Subtitle (left) and Date (right, if location was used in line 1)
                if item.subtitle:
                    left_2 = rf"\textit{{{escape_latex(item.subtitle)}}}"
                    right_2 = rf"\textit{{{escape_latex(item.date)}}}" if item.date and item.location else ""
                    line_2 = rf"{left_2} \hfill {right_2}" if right_2 else left_2
                    latex.append(line_2 + r" \\")
                    
                # Bullets
                if item.bullets:
                    latex.append(r"\begin{itemize}")
                    for bullet in item.bullets:
                        latex.append(rf"\item {escape_latex(bullet)}")
                    latex.append(r"\end{itemize}")
                    
                latex.append(r"\vspace{4pt}")
                
    latex.append(r"\end{document}")
    return "\n".join(latex)
