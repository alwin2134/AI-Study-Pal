# AI Study Pal 🎓
**Capstone Project - Fall 2025**

## Overview
AI Study Pal is an intelligent study companion that transforms static notes into interactive learning experiences. It features RAG-based chat, automated quiz generation, and smart summarization using local LLMs.

## 📂 Submission Structure
*   **`backend/`**: Python Flask API & AI Logic.
*   **`src/`**: React Frontend source code.
*   **`submission_docs/`**: **REQUIRED DOCUMENTATION**
    *   📘 `User_Manual.md`: Step-by-step guide & How-to-run.
    *   📄 `project_report.md`: Formal academic report (PDF-ready).
    *   🧪 `System_Testing_Report.md`: Test cases & validation results.
    *   🏗️ `architecture_diagrams.md`: System design flows.

## 🚀 Quick Start (Local Run)

### 1. Prerequisites
*   Python 3.10+
*   Node.js & npm

### 2. Setup Backend
```bash
# In the root terminal
pip install -r requirements.txt
python backend/app.py
```
*Server runs at: `http://127.0.0.1:5000`*

### 3. Setup Frontend
```bash
# In a new terminal
npm install
npm run dev
```
*App runs at: `http://localhost:8080`*

## 🔑 Environment Variables
Create a `.env` file in the root directory with:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## 📝 Features & Testing
Refer to the **[User Manual](submission_docs/User_Manual.md)** for detailed usage instructions and **[System Testing Report](submission_docs/System_Testing_Report.md)** for validation evidence.

---
*Ready for Submission / Evaluation.*
