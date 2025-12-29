import requests
import json

BASE = "http://127.0.0.1:5000/api"

def test_rag_llm():
    print("--- Testing Contextual RAG (Local LLM + Notes) ---")
    
    # 1. Upload a file
    filename = "test_data_rag.txt"
    content = "The Secret Project uses the code name 'Project Orion'. It is located in Nevada."
    with open(filename, "w") as f:
        f.write(content)
        
    print(f"Uploading {filename}...")
    with open(filename, "rb") as f:
        res = requests.post(f"{BASE}/upload", files={"file": f}, data={"bucketName": "Test Bucket"})
        if res.status_code == 200:
             print("✅ Upload successful")
        else:
             print(f"❌ Upload failed: {res.text}")
             return

    # 2. Ask a question about it
    query = "What is the code name of the secret project?"
    payload = {
        "message": query,
        "useNotes": True, 
        "bucketName": "Test Bucket" 
    }
    
    print(f"Querying: {query}")
    try:
        res = requests.post(f"{BASE}/chat", json=payload)
        data = res.json()
        ans = data.get("content", "")
        
        print(f"\nResponse: {ans}")
        
        if "Orion" in ans:
            print("✅ RAG successful (Retrieved correct info)")
        else:
            print("❌ RAG failed (Info missing)")
            
        if "Based on your notes:" not in ans:
             print("✅ LLM Synthesis successful (Custom answer generated)")
        else:
             print("⚠️ Fallback to raw snippets used (LLM might have failed or prompt overridden)")
             
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_rag_llm()
