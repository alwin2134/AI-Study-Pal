from typing import List
import os

try:
    from sentence_transformers import SentenceTransformer
    ST_AVAILABLE = True
except Exception:
    ST_AVAILABLE = False

# Simple wrapper for sentence-transformers embeddings with batching
class Embeddings:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model_name = model_name
        self.model = None
        if ST_AVAILABLE:
            try:
                self.model = SentenceTransformer(model_name)
            except Exception as e:
                print(f"Warning: failed to load SentenceTransformer '{model_name}': {e}")

    def embed_documents(self, texts: List[str], batch_size: int = 32):
        if not self.model:
            raise RuntimeError('SentenceTransformer model not available')
        embeddings = self.model.encode(texts, batch_size=batch_size, show_progress_bar=False, convert_to_numpy=True)
        return embeddings

    def embed_query(self, text: str):
        if not self.model:
            raise RuntimeError('SentenceTransformer model not available')
        return self.model.encode([text], convert_to_numpy=True)[0]


# Convenience singleton
_GLOBAL = None

def get_embeddings_instance():
    global _GLOBAL
    if _GLOBAL is None:
        _GLOBAL = Embeddings()
    return _GLOBAL
