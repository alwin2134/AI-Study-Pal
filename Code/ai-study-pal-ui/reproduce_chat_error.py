
import requests
import json

def test_chat():
    url = "http://127.0.0.1:5000/api/chat"
    payload = {
        "message": "Hello",
        "useNotes": False,
        "provider": "local"
    }
    
    try:
        print(f"Sending request to {url}...")
        res = requests.post(url, json=payload, timeout=10)
        print(f"Status Code: {res.status_code}")
        print("Response Text:")
        print(res.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_chat()
