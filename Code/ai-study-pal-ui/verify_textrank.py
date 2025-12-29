import requests
import json

BASE = "http://127.0.0.1:5000/api"
FILENAME = "Artificial_Intelligence_Capstone_Project.txt"
BUCKET = "ai launched"

def test_quality():
    print(f"Testing TextRank for '{FILENAME}'...")
    payload = {
        "filenames": [FILENAME],
        "bucketName": BUCKET
    }
    try:
        # Force encoding to handle potential charmap issues in windows console
        res = requests.post(f"{BASE}/summarize", json=payload)
        if res.status_code == 200:
            data = res.json()
            summary = data.get('summary', '')
            themes = data.get('key_themes', [])
            
            print(f"✅ Success!")
            print(f"Summary Len: {len(summary)}")
            print(f"Key Themes ({len(themes)}):")
            for t in themes:
                print(f"  - {t[:80]}...")
            
            print("\n--- Summary Snippet ---")
            print(summary[:200] + "...")
            
            if len(themes) > 0 and len(summary) > 50:
                 print("\nVerdict: TextRank is working & returning structured data.")
            else:
                 print("\nVerdict: ⚠️ Connected but output seems empty/weak.")
            
        else:
            print(f"❌ Failed: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_quality()
