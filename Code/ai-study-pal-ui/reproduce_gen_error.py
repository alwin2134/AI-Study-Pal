
import requests
import json
import time

def test_chat_rag():
    url = "http://127.0.0.1:5000/api/chat"
    # Test strict Upgrade RAG mode
    payload = {
        "message": "What is LlamaIndex?",
        "useNotes": True,
        "bucketName": "Tech Stack", # Must match what I verify/upload or use a dummy.
        # Wait, if no files are indexed, it returns NOT_IN_NOTES or error?
        # Let's try to upload a file first to be sure, or just hit it and expect NOT_IN_NOTES.
        "provider": "local"
    }
    
    try:
        print(f"Sending request to {url}...")
        start = time.time()
        res = requests.post(url, json=payload, timeout=30)
        print(f"Time: {time.time() - start:.2f}s")
        print(f"Status Code: {res.status_code}")
        print("Response Text:")
        print(res.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_chat_rag()
