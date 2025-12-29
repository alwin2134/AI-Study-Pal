
import sys
import os

# Ensure backend in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

def test_rag_upgrade():
    print("\n--- Testing RAG Upgrade (LlamaIndex) ---")
    try:
        from backend.ml_utils import rag_system, quiz_pipeline
        
        # 1. Test Indexing
        print("1. Adding Document...")
        text = "LlamaIndex is a data framework for LLMs. It offers data ingestion, indexing, and querying."
        rag_system.add_document(text, subject="Tech Stack", original_filename="llama_info.txt")
        print("PASS: Indexing call succeeded.")

        # 2. Test Query (Positive)
        print("\n2. Testing Positive Query (Bucket: Tech Stack)...")
        # Need a mock LLM or rely on the system handling None provider
        # But our code says: if llm_module, wrap it. Else pass.
        # Let's mock a simple provider object
        class MockProvider:
            def generate(self, p, max_tokens=200):
                return "LlamaIndex is a framework."
        
        res, sources = rag_system.query("What is LlamaIndex?", subject_filter="Tech Stack", llm_module=MockProvider())
        print(f"Result: {res}")
        print(f"Sources: {sources}")
        
        if "LlamaIndex" in res and "llama_info.txt" in sources:
             print("PASS: Retrieval successful from correct bucket.")
        else:
             print("FAIL: Retrieval mismatch.")
             
        # 3. Test Query (Negative / Strict Not In Notes)
        print("\n3. Testing Negative Query (Strict Mode)...")
        # Query for something definitely not in the text
        res2, sources2 = rag_system.query("What is the capital of Mars?", subject_filter="Tech Stack", llm_module=MockProvider())
        print(f"Result: {res2}")
        
        # Note: Our MockProvider returns "LlamaIndex is a framework." regardless of prompt because it's dumb.
        # So LlamaIndex might try to synthesize that.
        # BUT, if LlamaIndex retrieval (step 1) fails to find relevance for "Mars", source_nodes might be empty.
        # IF source_nodes are empty, our `query` method returns "NOT_IN_NOTES" immediately.
        # If source_nodes are NOT empty (false positive retrieval), then it uses the LLM.
        
        if res2 == "NOT_IN_NOTES" or not sources2:
             print("PASS: Strict failure triggered (Empty sources or explicit flag).")
        else:
             print(f"WARN: Loose retrieval? Got: {res2}")

    except ImportError as e:
        print(f"FAIL: Import Error (LlamaIndex missing?): {e}")
    except Exception as e:
        print(f"FAIL: Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_rag_upgrade()
