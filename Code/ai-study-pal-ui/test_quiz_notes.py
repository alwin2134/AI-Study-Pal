import requests
import json
import os
import sys

# Check metadata
try:
    with open('backend/data/uploads_metadata.json', 'r') as f:
        print("Metadata content:", f.read())
except:
    print("Metadata file not found or empty")

url = "http://127.0.0.1:5000/api/quiz"
payload = {"topic": "My Notes", "numQuestions": 5}

try:
    print(f"Sending request to {url}...")
    res = requests.post(url, json=payload, timeout=30)
    print(f"Status: {res.status_code}")
    data = res.json()
    if data.get('questions'):
        qt = data['questions'][0]
        print(f"Sample Question: {qt['question']}")
        print(f"Options: {qt['options']}")
        if "Option A" in qt['options']:
             print("❌ FAIL: Placeholders found!")
        else:
             print("✅ PASS: Real distractors generated!")
    else:
        print("Response:", data)
except Exception as e:
    print(f"Error: {e}")
