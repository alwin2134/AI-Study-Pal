
import requests
import time

def check_health():
    url = "http://127.0.0.1:5000/api/health"
    print(f"Checking {url}...")
    try:
        res = requests.get(url, timeout=5)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

if __name__ == "__main__":
    check_health()
