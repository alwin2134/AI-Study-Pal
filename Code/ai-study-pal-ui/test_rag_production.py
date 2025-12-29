import requests
import os
import json

# 1. Create Dummy Files
file_bio = "bio_notes.txt"
with open(file_bio, "w") as f:
    f.write("Mitochondria is the powerhouse of the cell.")

file_history = "history_notes.txt"
with open(file_history, "w") as f:
    f.write("The French Revolution began in 1789.")

url_upload = "http://127.0.0.1:5000/api/upload"
url_ask = "http://127.0.0.1:5000/api/ask-notes"

def upload(filename, bucket):
    files = {'file': open(filename, 'rb')}
    data = {'bucketName': bucket}
    try:
        res = requests.post(url_upload, files=files, data=data)
        print(f"Upload {filename} to {bucket}: {res.status_code}")
    except Exception as e:
        print(f"Upload failed: {e}")

def ask(question, subject):
    payload = {"question": question, "subject": subject}
    try:
        res = requests.post(url_ask, json=payload)
        data = res.json()
        print(f"\nQ: {question} (Filter: {subject})")
        print(f"A: {data.get('answer')}")
        print(f"Sources: {data.get('sources')}")
        return data
    except Exception as e:
        print(f"Ask failed: {e}")
        return {}

print("--- 1. Uploading Files ---")
upload(file_bio, "Biology")
upload(file_history, "History")

print("\n--- 2. Testing Strict Filtering ---")

# Test 1: Ask Bio in Bio Bucket (Should Work)
res1 = ask("What is the powerhouse of the cell?", "Biology")
if "Mitochondria" in res1.get('answer', '') and "bio_notes.txt" in str(res1.get('sources', [])):
    print("✅ Test 1 Passed: Found in correct bucket.")
else:
    print("❌ Test 1 Failed.")

# Test 2: Ask Bio in History Bucket (Should Fail)
res2 = ask("What is the powerhouse of the cell?", "History")
if "couldn't find" in res2.get('answer', ''):
    print("✅ Test 2 Passed: Correctly blocked by filter.")
else:
    print(f"❌ Test 2 Failed: Leakage detected! {res2.get('answer')}")

# Test 3: Ask History in History Bucket (Should Work)
res3 = ask("When did the French Revolution begin?", "History")
if "1789" in res3.get('answer', ''):
    print("✅ Test 3 Passed: Found in correct bucket.")
else:
    print("❌ Test 3 Failed.")

# Cleanup
for f in [file_bio, file_history]:
    if os.path.exists(f):
        os.remove(f)
