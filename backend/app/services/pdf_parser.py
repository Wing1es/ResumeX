import fitz  # PyMuPDF
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts all text from a PDF file provided as bytes.
    """
    text = ""
    try:
        # Open the PDF from bytes
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return ""
    
    return text.strip()
