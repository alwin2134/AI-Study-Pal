# 📄 AI Study Pal - Project Report

## 1. Introduction

Educational tools often fail to address individual student needs. Generic chatbots hallucinate or provide irrelevant answers, while traditional LMS platforms are rigid. **AI Study Pal** bridges this gap by creating a "Second Brain" for students—an AI that runs locally, respects privacy, and understands the student's personal notes.

## 2. System Architecture

The system follows a modern **Client-Server** architecture:

### 2.1 Backend (Python Flask)

- **Reasoning Engine:** Handles complex logic (RAG pipeline, Quiz Generation).
- **Hardware Abstraction Layer (`llm_providers.py`):** Automatically selects the best execution strategy (CUDA vs CPU AVX2) based on the host machine.
- **Vector Memory:** Uses FAISS to index uploaded documents for rapid semantic retrieval.

### 2.2 Frontend (React)

- **Responsive UI:** Built with Tailwind CSS and Shadcn/UI for a premium, accessible user experience.
- **Visualization:** Uses Recharts to render study progress and analytics.

### 2.3 Data Persistence (Supabase)

- **Authentication:** Secure user login.
- **Storage:** Notes, quiz history, and user profiles are stored in PostgreSQL.

## 3. Key Challenges & Solutions

### Challenge 1: Local AI Performance

*Problem:* Running LLMs on student laptops is slow.
*Solution:* Implemented `SmartLoader`, a class that detects NVIDIA GPUs. If a GPU is found, it loads a quantized GGUF model via `ctransformers` to offload computation, achieving 10x speedup.

### Challenge 2: "Phantom File" Errors

*Problem:* The quiz engine tried to download non-existent files when users selected "My Notes".
*Solution:* Refactored the backend to treat inputs as Database IDs, fetching content directly from Supabase/PostgreSQL instead of the file system.

### Challenge 3: Windows Console Compatibility

*Problem:* The application crashed on Windows servers due to `UnicodeEncodeError` when printing status emojis (🚀).
*Solution:* Sanitized all server logs for maximum cross-platform compatibility.

## 4. Future Scope

1. **Voice Interaction:** Adding Speech-to-Text for oral quizzes.
2. **Mobile App:** Porting the React frontend to React Native.
3. **Collaborative Study:** Allowing students to share "Note Buckets" with peers.

## 5. Conclusion

AI Study Pal demonstrates that powerful, personalized AI education tools can be built with privacy and efficiency in mind. By leveraging local inference and RAG, it provides a superior learning experience without reliance on expensive cloud APIs.
