import requests
import json

BASE = "http://127.0.0.1:5000/api"

def test_general_mode():
    print("--- Testing 'AI Only' (General) Mode ---")
    
    # Query that requires external knowledge, not in notes
    query = "Explain the theory of relativity in simple terms."
    
    payload = {
        "message": query,
        "useNotes": False, # This triggers "AI Only" mode
        "bucketName": "" 
    }
    
    try:
        print(f"Query: {query}")
        res = requests.post(f"{BASE}/chat", json=payload)
        
        if res.status_code == 200:
            data = res.json()
            # API returns OpenAI-style response: {"role": "assistant", "content": "..."}
            ans = data.get("content", "")
            if not ans:
                ans = data.get("answer", "") # Fallback just in case
            sources = data.get("sources", [])
            
            print(f"\n✅ Response Received (Length: {len(ans)} chars)")
            print(f"Answer Snippet: {ans[:200]}...")
            
            # Verification Logic
            if len(sources) == 0:
                print("✅ Sources: None (Correct for AI Only mode)")
            else:
                print(f"⚠️ Warning: Sources returned in AI Only mode! {sources}")
                
            if "Einstein" in ans or "gravity" in ans or "speed of light" in ans:
                 print("✅ Context: Answer contains relevant general knowledge.")
            else:
                 print("⚠️ Answer might be hallucinated or completely off.")
                 
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_general_mode()
