import requests
import json

BASE = "http://127.0.0.1:5000/api"

def test_chat_modes():
    print("--- Verifying Chat Modes ---")

    # 1. Test General Mode
    print("\n1. Testing General AI Mode (useNotes=False)...")
    payload_gen = {
        "message": "What is the capital of France?",
        "useNotes": False,
        "bucketName": "" # Should be ignored or irrelevant
    }
    try:
        res = requests.post(f"{BASE}/chat", json=payload_gen)
        if res.status_code == 200:
            ans = res.json().get("answer", "")
            print(f"✅ Success. Answer: {ans}")
            if "Paris" in ans:
                 print("   -> Correctly identified as general knowledge.")
            else:
                 print("   -> ⚠️ Answer seems off, check logic.")
        else:
            print(f"❌ Failed: {res.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # 2. Test RAG Mode
    print("\n2. Testing RAG Mode (useNotes=True, Bucket='ai launched')...")
    payload_rag = {
        "message": "What is the main goal of the project?",
        "useNotes": True,
        "bucketName": "ai launched"
    }
    try:
        res = requests.post(f"{BASE}/chat", json=payload_rag)
        if res.status_code == 200:
            data = res.json()
            ans = data.get("answer", "")
            sources = data.get("sources", [])
            print(f"✅ Success. Answer Len: {len(ans)}")
            print(f"   -> Sources Found: {len(sources)}")
            if len(sources) > 0:
                print(f"   -> First Source: {sources[0]['original_name']}")
                print("   -> RAG is working and retrieving context.")
            else:
                print("   -> ⚠️ No sources found. RAG might be failing.")
                
        else:
            print(f"❌ Failed: {res.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_chat_modes()
