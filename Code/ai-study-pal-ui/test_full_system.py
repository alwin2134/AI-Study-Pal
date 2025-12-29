import requests
import json
import time

BASE = "http://127.0.0.1:5000/api"
FAILURES = []
IMPROVEMENTS = []

def log_fail(feature, error):
    print(f"❌ [FAIL] {feature}: {error}")
    FAILURES.append(f"{feature}: {error}")

def log_pass(feature, msg=""):
    print(f"✅ [PASS] {feature} {msg}")

def test_full_system():
    print("=== STARTING FULL SYSTEM AUDIT ===\n")
    
    # 1. Health / Connection
    try:
        requests.get("http://127.0.0.1:5000/") # Just check connection
        log_pass("Backend Connection")
    except:
        log_fail("Backend Connection", "Server is down or unreachable")
        return

    # 2. Upload Feature
    filename = "audit_doc.txt"
    content = "Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI applications include advanced web search engines, recommendation systems, understanding human speech, self-driving cars, automated decision-making and competing at the highest level in strategic game systems. " * 5
    with open(filename, "w") as f:
        f.write(content)
    
    try:
        with open(filename, "rb") as f:
            res = requests.post(f"{BASE}/upload", files={"file": f}, data={"bucketName": "AuditBucket"})
            if res.status_code == 200:
                log_pass("File Upload", "(to AuditBucket)")
            else:
                log_fail("File Upload", res.text)
    except Exception as e:
        log_fail("File Upload", str(e))

    # 3. Summarizer Feature
    try:
        payload = {"filenames": [filename], "bucketName": "AuditBucket"}
        res = requests.post(f"{BASE}/summarize", json=payload)
        data = res.json()
        if "summary" in data and "key_themes" in data:
            if len(data["key_themes"]) > 0:
                log_pass("Summarizer", "- Structured output received")
            else:
                log_fail("Summarizer", "Key themes empty")
        else:
            log_fail("Summarizer", f"Invalid response format: {data.keys()}. Error content: {data.get('error')}")
    except Exception as e:
        log_fail("Summarizer", str(e))

    # 4. Chat: AI Only Mode
    try:
        query = "Explain AI in simple terms."
        res = requests.post(f"{BASE}/chat", json={"message": query, "useNotes": False})
        data = res.json()
        ans = data.get("content", "")
        if len(ans) > 20 and "Based on your notes" not in ans:
             log_pass("Chat (AI Only)", f"- Response length: {len(ans)} chars")
             print(f"   Sample: {ans[:100]}...")
        else:
             log_fail("Chat (AI Only)", f"Weak response: {ans}")
             IMPROVEMENTS.append("AI Only: Model hallucinated or returned empty text.")
    except Exception as e:
        log_fail("Chat (AI Only)", str(e))

    # 5. Chat: RAG Mode (Contextual)
    try:
        query = "What are applications of AI?"
        res = requests.post(f"{BASE}/chat", json={"message": query, "useNotes": True, "bucketName": "AuditBucket"})
        data = res.json()
        ans = data.get("content", "")
        if "self-driving cars" in ans or "web search" in ans:
             log_pass("Chat (RAG Mode)", "- Correctly retrieved context from file")
        else:
             log_fail("Chat (RAG Mode)", "Failed to retrieve keywords 'self-driving' or 'web search'")
             IMPROVEMENTS.append("RAG: Retrieval accuracy or Contextual Synthesis needs improvement.")
    except Exception as e:
        log_fail("Chat (RAG Mode)", str(e))

    # 6. Quiz Generation
    try:
        # Use 'Biology' which exists in dataset.csv to verify mechanism
        res = requests.post(f"{BASE}/quiz", json={"topic": "Biology"})
        data = res.json()
        if isinstance(data, list) and len(data) > 0:
             log_pass("Quiz Generator", f"- Generated {len(data)} questions")
        else:
             log_fail("Quiz Generator", "No questions returned")
    except Exception as e:
        log_fail("Quiz Generator", str(e))

    print("\n=== AUDIT REPORT ===")
    if not FAILURES:
        print("🟢 SYSTEM STATUS: FULLY OPERATIONAL")
    else:
        print(f"🔴 SYSTEM STATUS: {len(FAILURES)} ISSUES FOUND")
        for f in FAILURES:
            print(f"  - {f}")
            
    print("\n=== SUGGESTED IMPROVEMENTS ===")
    if not IMPROVEMENTS:
        print("  - None! System is behaving perfectly within specs.")
    else:
        for i in IMPROVEMENTS:
            print(f"  - {i}")
            
    # Recommendations based on architecture
    print("  - [General] distilgpt2 is small (~82M params). For 'Smart' results, upgrade to Llama-3-8B-Quantized.")
    print("  - [RAG] Add re-ranking step for better precision.")

if __name__ == "__main__":
    test_full_system()
