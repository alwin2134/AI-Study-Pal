# Codebase Reference Guide 📖

*A complete dictionary of every file in the project.*

## 📂 Backend (`Code/backend/`)

The Python Flask server that powers the AI and database logic.

### 🧠 Core Application

| File | Purpose |
| :--- | :--- |
| **`app.py`** | **Entry Point**. The Flask server that defines API routes (`/api/chat`, `/api/generate`, etc.) and handles HTTP requests. |
| **`requirements.txt`** | **Dependencies**. Lists all Python libraries required to run the backend (Flask, LangChain, Torch, etc.). |

### 🤖 AI & Logic

| File | Purpose |
| :--- | :--- |
| **`ml_utils.py`** | **AI Orchestrator**. Main logic for RAG pipeline, Summarization, and Study Plan generation strategies. |
| **`llm_providers.py`** | **Hardware Manager**. Detects GPU/AVX2 and loads the specific LLM model (TinyLlama) optimized for the device. |
| **`embeddings.py`** | **Vector Logic**. Converts text into numerical vectors using HuggingFace models for semantic search. |
| **`vector_store.py`** | **Database**. Manages the FAISS vector index to store and retrieve document chunks. |
| **`generate_qa.py`** | **Quiz Engine**. Algorithms to generate questions from text content using the LLM. |
| **`file_processor.py`** | **Ingestion**. Utilities to read and parse PDF, DOCX, and TXT files uploaded by users. |
| **`verifier.py`** | **System Health**. Startup scripts to check if models key files are present before the app starts. |

### 💾 Data & storage

| File | Purpose |
| :--- | :--- |
| **`supabase_client.py`** | **Database Connector**. Wraps the Supabase API to save users, notes, and profile data to the cloud. |
| **`data_manager.py`** | **Local Cache**. Helper for managing temporary local file storage before upload. |
| **`metadata_manager.py`** | **Indexing**. Tracks which files have been processed and indexed into the vector store. |
| **`background.py`** | **Async Tasks**. Helper for running long processes (like indexing large PDFs) without blocking the UI. |

### 🧪 Testing

| File | Purpose |
| :--- | :--- |
| **`test_rag.py`** | **Unit Test**. A simple script to verify the RAG system retrieves correct answers from knowledge base. |

---

## 💻 Frontend (`Code/frontend/`)

The React application that users interact with.

### ⚙️ Configuration (Root)

| File | Purpose |
| :--- | :--- |
| **`package.json`** | **Project Manifest**. Lists Node.js dependencies (React, Vite, Tailwind) and start scripts. |
| **`vite.config.ts`** | **Build Tool**. Configures the dev server and proxy to forward API requests to Flask (`localhost:5000`). |
| **`tsconfig.json`** | **TypeScript**. Rules for the TypeScript compiler (strict mode, paths). |
| **`tailwind.config.ts`** | **Design System**. Defines the color palette, fonts, and border radius used by Tailwind CSS. |
| **`postcss.config.js`** | **CSS Processor**. Plugin loader required for Tailwind to work. |
| **`index.html`** | **HTML Entry**. The single HTML file that loads the React Javascript bundle. |
| **`public/`** | **Assets**. Static files like the favicon and manifest.json. |

### 📄 Pages (`src/pages/`)

| File | Purpose |
| :--- | :--- |
| **`Landing.tsx`** | **Home**. The public marketing page shown before login. |
| **`Auth.tsx`** | **Login/Signup**. Handles user authentication via Supabase Auth. |
| **`Dashboard.tsx`** | **Home Hub**. Displays charts, recent activity, and quick access buttons. |
| **`ChatPage.tsx`** | **AI Assistant**. The main interface for chatting with the Study Pal (RAG/AI modes). |
| **`NotesPage.tsx`** | **Knowledge Base**. UI for uploading files and writing text notes. |
| **`StudyPlanPage.tsx`** | **Planner**. Generates and displays the structured study schedule timeline. |
| **`SummarizerPage.tsx`** | **Tool**. dedicated interface for summarization tasks with Tabbed inputs. |
| **`QuizPrep.tsx`** | **Quiz Setup**. Screen to select topic and difficulty before starting a quiz. |
| **`QuizActive.tsx`** | **Taking Quiz**. The interface for answering questions in real-time. |
| **`QuizHistoryPage.tsx`** | **Results**. Shows past quiz scores and performance trends. |
| **`ProfilePage.tsx`** | **Settings**. Form to update user syllabus, grade, and preferences. |
| **`AnalyticsPage.tsx`** | **Stats**. Detailed graphs of study time and progress. |
| **`TipsPage.tsx`** | **Advice**. Generated study tips based on user habits. |
| **`AskNotesPage.tsx`** | **Quick Query**. A simplified version of Chat focused only on querying notes. |
| **`FeedbackPage.tsx`** | **Support**. Form for users to submit feedback. |
| **`ResourcesPage.tsx`** | **Links**. Helpful external educational resources. |
| **`NotFound.tsx`** | **404**. Error page displayed for invalid URLs. |

### 🧩 Components (`src/components/`)

*Re-usable UI elements.*

- **`layout/`**: `Sidebar.tsx`, `Navbar.tsx` (Global navigation).
- **`ui/`**: 20+ atomic components (Button, Input, Card, Dialog) from shadcn/ui.
- **`chat/`**: `ChatWindow.tsx`, `MessageBubble.tsx` (Chat specifics).
