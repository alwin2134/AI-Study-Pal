
import sys
import os

# Ensure backend in path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

def test_langchain_migration():
    print("\n--- Testing RAG Migration (LangChain) ---")
    try:
        from backend.ml_utils import rag_system
        
        # 1. Test Imports & Init
        if rag_system.vectorstore is None and rag_system.is_indexed is False:
             print("PASS: System initialized (Empty state).")
        else:
             print("FAIL: System init state unexpected.")

        # 2. Test Indexing
        print("\n1. Adding Document...")
        text = "LangChain is a framework for developing applications powered by language models."
        rag_system.add_document(text, subject="AI Frameworks", original_filename="langchain_intro.txt")
        print("PASS: Indexing call succeeded.")

        # 3. Test Positive Query (Correct Bucket)
        print("\n2. Testing Positive Query (Bucket: AI Frameworks)...")
        
        class MockProvider:
            def generate(self, p, max_tokens=200):
                return "LangChain is an AI framework."
        
        res, sources = rag_system.query("What is LangChain?", subject_filter="AI Frameworks", llm_module=MockProvider())
        print(f"Result: {res}")
        print(f"Sources: {sources}")
        
        if "LangChain" in res and "langchain_intro.txt" in sources:
             print("PASS: Retrieval successful from correct bucket.")
        else:
             print("FAIL: Retrieval mismatch.")

        # 4. Test Negative Query (Wrong Bucket)
        print("\n3. Testing Negative Query (Wrong Bucket)...")
        res2, sources2 = rag_system.query("What is LangChain?", subject_filter="Cooking", llm_module=MockProvider())
        print(f"Result: {res2}")
        
        if res2 == "NOT_IN_NOTES" and not sources2:
             print("PASS: Bucket filtering worked (Returned NOT_IN_NOTES).")
        else:
             print(f"FAIL: Leaked data across buckets? Result: {res2}")

        # 5. Test Irrelevant Query (Strict Mode)
        print("\n4. Testing Irrelevant Query (Strict Mode)...")
        # "Pizza" is not in the text. FAISS might find *something* if k is huge, 
        # but with k=3 and relevance scores, it might still return doc. 
        # However, our Mock LLM is dumb. 
        # The key check is if LangChain retriever returns docs. 
        # FAISS defaults to distance search. 
        # If "Pizza" is queried against "LangChain...", distance is high.
        # But standard FAISS returns top-k nearest regardless of distance unless score_threshold is set.
        # Let's see if the LLM prompt injection works (Mock LLM returns static text, so we rely on retrieving *something*).
        # Actually, strictness comes from "if not docs". 
        # Standard FAISS retriever always returns documents if index is not empty.
        # So we might need to add a score check or relying on the LLM to say "NOT_IN_NOTES".
        # BUT, the user requirement for THIS task said: "if not docs: return NOT_IN_NOTES".
        # Let's see what happens.
        
        res3, sources3 = rag_system.query("How to make pizza?", subject_filter="AI Frameworks", llm_module=MockProvider())
        print(f"Result: {res3}")
        
    except ImportError as e:
        print(f"FAIL: Import Error: {e}")
    except Exception as e:
        print(f"FAIL: Exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_langchain_migration()
