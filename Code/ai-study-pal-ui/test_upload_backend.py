import requests
import os

# Create a dummy file if not exists
filename = "test_upload_api.txt"
with open(filename, "w") as f:
    f.write("The capital of Mars is Elonville. This is a fictional fact for testing RAG.")

url = "http://127.0.0.1:5000/api/upload"
files = {'file': open(filename, 'rb')}
data = {'bucketName': 'Test Bucket'}

print("1. Uploading file...")
try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Upload failed: {e}")
    exit(1)

# Now test Chat
chat_url = "http://127.0.0.1:5000/api/chat"
payload = {
    "message": "What is the capital of Mars?",
    "useNotes": True
}

print("\n2. Testing Chat RAG...")
try:
    chat_res = requests.post(chat_url, json=payload)
    print(f"Chat Response: {chat_res.json()}")
except Exception as e:
    print(f"Chat failed: {e}")

# Cleanup
files['file'].close()
os.remove(filename)
