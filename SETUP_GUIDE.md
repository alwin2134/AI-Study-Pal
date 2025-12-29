# 🛠️ Installation & Setup Guide

Follow these steps to set up **AI Study Pal** on a Windows machine.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Git**
- **Supabase Account** (for database)

---

## 1. Clone the Repository

```powershell
git clone <repository_url>
cd AI-Study-Pal
```

## 2. Backend Setup (Python)

1. **Navigate to the backend directory:**

    ```powershell
    cd ai-study-pal-ui/backend
    ```

2. **Create a Virtual Environment (Optional but Recommended):**

    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate
    ```

3. **Install Dependencies:**
    *Note: This includes PyTorch, Transformers, LangChain, and Flask.*

    ```powershell
    pip install -r requirements.txt
    ```

    *(If you have an NVIDIA GPU, verify that `torch` with CUDA support is installed)*

4. **Environment Variables (`.env`):**
    Create a `.env` file in the root `ai-study-pal-ui` folder (one level up from `backend/`).
    Add the following keys:

    ```env
    # Database
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key

    # Optional Cloud AI (if Local LLM is too slow)
    GEMINI_API_KEY=your_gemini_key
    OPENAI_API_KEY=your_openai_key
    ```

5. **Start the Server:**

    ```powershell
    python app.py
    ```

    *You should see logs indicating "Smart Loader" is scanning your hardware.*

---

## 3. Frontend Setup (React)

1. **Open a NEW terminal window.**

2. **Navigate to the frontend directory:**

    ```powershell
    cd ai-study-pal-ui
    ```

3. **Install Node Modules:**

    ```powershell
    npm install
    # or
    npm install --force
    ```

4. **Start the Web Serevr:**

    ```powershell
    npm run dev
    ```

5. **Access the App:**
    Open your browser and visit: `http://localhost:5173`

---

## 🛑 Troubleshooting

- **"Rocket" Emoji Crash:** If the backend crashes with a `UnicodeEncodeError`, ensure your console supports emojis or update the code to remove them (already patched in latest version).
- **"Module Not Found":** Ensure you activated the virtual environment before running `python app.py`.
- **Database Error:** Verify your `.env` file exists in the correct location (`ai-study-pal-ui/`) and contains valid Supabase credentials.
