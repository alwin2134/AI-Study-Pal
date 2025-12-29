import os
import pypdf
import docx

def extract_text_from_file(file_path):
    """
    Extracts text from PDF, DOCX, or TXT/MD files.
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    try:
        if ext == '.pdf':
            return _read_pdf(file_path)
        elif ext == '.docx':
            return _read_docx(file_path)
        elif ext in ['.txt', '.md']:
            return _read_text(file_path)
        else:
            return f"Error: Unsupported file type {ext}"
    except Exception as e:
        return f"Error reading file: {str(e)}"

def _read_pdf(path):
    text = ""
    with open(path, 'rb') as f:
        reader = pypdf.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text

def _read_docx(path):
    doc = docx.Document(path)
    return "\n".join([para.text for para in doc.paragraphs])

def _read_text(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def save_uploaded_file(file, upload_folder, filename):
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    return filepath
