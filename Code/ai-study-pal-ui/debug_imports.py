
import sys
import os
import traceback

print("\n--- Testing Specific Imports ---")

try:
    from llama_index.core import VectorStoreIndex
    print("PASS: llama_index.core.VectorStoreIndex")
except ImportError:
    print("FAIL: llama_index.core.VectorStoreIndex")
    traceback.print_exc()

try:
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding
    print("PASS: llama_index.embeddings.huggingface.HuggingFaceEmbedding")
except ImportError:
    print("FAIL: llama_index.embeddings.huggingface.HuggingFaceEmbedding")
    traceback.print_exc()
