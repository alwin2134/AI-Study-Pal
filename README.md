# 🎓 AI Study Pal - Capstone Project Submission

**Student Name:** Alwin
**Project Title:** AI Study Pal: Personalized RAG-Based Learning Assistant
**Date:** December 2025

---

## 🚀 Project Overview

**AI Study Pal** is a local-first, privacy-focused educational platform designed to help students learn faster and more effectively. Unlike generic AI chatbots, it uses **Retrieval Augmented Generation (RAG)** to "read" your personal notes and syllabus, ensuring that every answer is relevant to your specific curriculum.

### Key Goals

1. **Personalization:** Adapt study plans and answers to the user's specific syllabus and files.
2. **Privacy:** Run AI models locally (TinyLlama) on consumer hardware without sending private data to the cloud.
3. **Efficiency:** Automate the creation of study schedules, quizzes, and summaries.

---

## ✨ Features

- **🧠 Chat with Notes (RAG)**: Upload PDF/DOCX files and ask questions. The system references your content to answer accurately.
- **📅 Dynamic Study Planner**: Generates a structured hourly schedule based on your subject, available hours, and goals.
- **❓ AI Quiz Engine**: Automatically generates Multiple Choice Questions (MCQs) from your notes or any academic topic. Tracks performance over time.
- **📊 Adaptive Analytics**: Visualizes your learning progress and knowledge gaps using dynamically generated charts.
- **📝 Intelligent Summarizer**: Distills long documents into key themes and actionable insights.
- **⚡ Hardware-Aware Backend**: "Smart Loader" detects your GPU (e.g., RTX 3050) and optimizes inference speed automatically.

---

## 🛠️ Technology Stack

### Frontend

- **Framework:** React + Vite (TypeScript)
- **UI Library:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts

### Backend

- **Server:** Python Flask
- **AI Models:** TinyLlama-1.1B (Local), Google Gemini (Cloud Fallback)
- **RAG Engine:** LangChain + FAISS + Sentence-Transformers
- **Database:** Supabase (PostgreSQL)

---

## 📂 Submission Contents

1. **`Demo_Script.md`**: A step-by-step script for presenting the project during the viva/demo.
2. **`Technical_Reference.md`**: A complete dictionary of every file in the codebase.
3. **`PROJECT_REPORT.md`**: A detailed report on architecture, challenges, and future scope.
4. **`SETUP_GUIDE.md`**: Instructions to install and run the project from scratch.

---

## ⚡ Quick Start

1. Navigate to `ai-study-pal-ui` folder.
2. Run `npm run dev` to start the Frontend.
3. In a new terminal, run `python backend/app.py` to start the Backend.
4. Open `http://localhost:5173`.

*(For full installation instructions, see `SETUP_GUIDE.md`)*
