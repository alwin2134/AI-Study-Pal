from typing import List, Dict, Any
import os
import json
import numpy as np

try:
    import faiss
    FAISS_AVAILABLE = True
except Exception:
    FAISS_AVAILABLE = False

from embeddings import get_embeddings_instance

class FaissStore:
    def __init__(self, dim: int = 384, index_path: str = 'backend/data/faiss.index', meta_path: str = 'backend/data/faiss_meta.json'):
        self.dim = dim
        self.index_path = index_path
        self.meta_path = meta_path
        self.index = None
        self.metadatas = {}  # id -> metadata
        if FAISS_AVAILABLE:
            self._init_index()

    def _init_index(self):
        if os.path.exists(self.index_path):
            try:
                self.index = faiss.read_index(self.index_path)
            except Exception:
                self.index = faiss.IndexFlatIP(self.dim)
        else:
            self.index = faiss.IndexFlatIP(self.dim)

        # load metadata
        if os.path.exists(self.meta_path):
            try:
                with open(self.meta_path, 'r', encoding='utf-8') as f:
                    self.metadatas = json.load(f)
            except Exception:
                self.metadatas = {}

    def add(self, embeddings: np.ndarray, metadatas: List[Dict[str, Any]]):
        if not FAISS_AVAILABLE:
            raise RuntimeError('FAISS not available')
        if embeddings.ndim == 1:
            embeddings = embeddings.reshape(1, -1)

        # normalize for inner product similarity if desired
        faiss.normalize_L2(embeddings)

        start_id = len(self.metadatas)
        ids = list(range(start_id, start_id + embeddings.shape[0]))
        # faiss IndexFlat does not store ids; for simple case append vectors
        self.index.add(embeddings.astype('float32'))

        # store metadata mapped to integer id (string keys for JSON)
        for i, m in zip(ids, metadatas):
            self.metadatas[str(i)] = m

        self._persist()

    def query(self, q_emb: np.ndarray, top_k: int = 5):
        if not FAISS_AVAILABLE:
            raise RuntimeError('FAISS not available')
        faiss.normalize_L2(q_emb)
        if q_emb.ndim == 1:
            q_emb = q_emb.reshape(1, -1)
        D, I = self.index.search(q_emb.astype('float32'), top_k)
        results = []
        for score, idx in zip(D[0], I[0]):
            if idx < 0:
                continue
            meta = self.metadatas.get(str(idx), {})
            results.append({'score': float(score), 'metadata': meta, 'id': idx})
        return results

    def _persist(self):
        try:
            faiss.write_index(self.index, self.index_path)
        except Exception as e:
            print(f"Warning: failed to persist faiss index: {e}")
        try:
            with open(self.meta_path, 'w', encoding='utf-8') as f:
                json.dump(self.metadatas, f)
        except Exception as e:
            print(f"Warning: failed to persist faiss metadata: {e}")


# Simple singleton wrapper
_STORE = None

def get_faiss_store(dim: int = 384):
    global _STORE
    if _STORE is None:
        _STORE = FaissStore(dim=dim)
    return _STORE
