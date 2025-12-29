import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

import supabase_client as supabase

def test():
    print("--- Checking Quiz Attempts ---")
    try:
        # fetch_quiz_attempts is not in client? 
        # use direct request
        url = supabase.SUPABASE_URL.rstrip('/') + "/rest/v1/quiz_attempts"
        headers = supabase._auth_headers()
        params = {"select": "*", "limit": 5}
        
        import requests
        r = requests.get(url, headers=headers, params=params)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print(f"Count: {len(data)}")
            print(f"Data: {data}")
        else:
            print(f"Error: {r.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test()
