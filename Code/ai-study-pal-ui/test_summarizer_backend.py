import requests
import json

BASE = "http://127.0.0.1:5000/api"

def test_list_files():
    print("Testing /api/files...")
    try:
        res = requests.get(f"{BASE}/files?bucket=ai%20launched")
        if res.status_code == 200:
            print(f"✅ /api/files Success: {res.json()}")
            return res.json()
        else:
            print(f"❌ /api/files Failed: {res.text}")
            return None
    except Exception as e:
        print(f"❌ /api/files Error: {e}")
        return None

def test_summarize(filename):
    print(f"\nTesting /api/summarize for {filename}...")
    payload = {
        "filenames": [filename],
        "bucketName": "ai launched"
    }
    try:
        res = requests.post(f"{BASE}/summarize", json=payload)
        if res.status_code == 200:
            print(f"✅ /api/summarize Success!")
            print(f"Summary: {res.json().get('summary')[:100]}...")
        else:
            print(f"❌ /api/summarize Failed: {res.text}")
    except Exception as e:
        print(f"❌ /api/summarize Error: {e}")

files = test_list_files()
if files:
    # Get first file key
    first_file = list(files.keys())[0]
    test_summarize(first_file)
