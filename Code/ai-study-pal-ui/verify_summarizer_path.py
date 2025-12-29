import requests
import json

BASE = "http://127.0.0.1:5000/api"

# Use a known file synced earlier
FILENAME = "Artificial_Intelligence_Capstone_Project.txt"
BUCKET = "ai launched"

def test_summarize():
    print(f"Testing summarization for '{FILENAME}'...")
    payload = {
        "filenames": [FILENAME],
        "bucketName": BUCKET
    }
    try:
        res = requests.post(f"{BASE}/summarize", json=payload)
        if res.status_code == 200:
            print(f"✅ Success! Summary len: {len(res.json().get('summary', ''))}")
            print(f"Summary Start: {res.json().get('summary')[:100]}")
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
            try:
                logs = res.json().get('debug_logs', [])
                if logs:
                    print("\n--- SERVER DEBUG LOGS ---")
                    for log in logs:
                        print(log)
            except:
                pass
    except Exception as e:
        print(f"❌ Error: {e}")

test_summarize()
