Backend setup and RAG notes

This folder contains the Flask backend and RAG-related helpers (embeddings, vector store, RAG orchestration).

Quick setup

1. Create a virtual environment (recommended):

```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
```

2. Install pinned dependencies:

```bash
pip install -r requirements.txt
```

3. Download NLTK data (run once):

```python
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"
```

Running the server

```bash
python app.py
```

Notes about models and optional components

- `sentence-transformers` is used for dense embeddings (`all-MiniLM-L6-v2` by default). If you want CPU-only inference, `faiss-cpu` is pinned. On machines with a GPU, installing `faiss-gpu` and `torch` with CUDA will speed up embedding and reranking.

- Cross-encoder reranking uses `cross-encoder/ms-marco-MiniLM-L-6-v2` via `sentence-transformers`. The first call will download the model and may take time and disk space.

- If you don't plan to use cross-encoder or local HF models, you may skip installing `transformers` and `torch`.

- `tiktoken` is optional and used to support token-aware chunking. If unavailable, chunking falls back to sentence-aware behavior.

Testing

Run tests from repository root:

```bash
pytest -q
```

Troubleshooting

- If FAISS install fails on Windows, consider using `faiss-cpu` wheels or run on Linux/macOS.
- If models fail to download due to network restrictions, pre-download them on a machine with internet and copy to the cache directory (`~/.cache/huggingface`).

Contact

If you want, I can also add a `docker-compose` setup to encapsulate dependencies and avoid local install issues.
