import requests

url = "http://127.0.0.1:5000/api/ask-notes"

def ask(question, subject):
    payload = {"question": question, "subject": subject}
    try:
        res = requests.post(url, json=payload)
        data = res.json()
        print(f"\nQ: {question} (Filter: {subject})")
        print(f"A: {data.get('answer')}")
        print(f"Sources: {data.get('sources')}")
        return data
    except Exception as e:
        print(f"Ask failed: {e}")
        return {}

print("--- Verifying 'ai launched' Bucket ---")
res = ask("What is the deadline?", "ai launched")

if "November 30" in str(res.get('answer')):
    print("✅ Verified: RAG found the deadline.")
else:
    print("❌ Failed: Could not find deadline.")

res2 = ask("What is the goal?", "ai launched")
if "comprehensive AI Study Pal" in str(res2.get('answer')):
     print("✅ Verified: RAG found the goal.")
else:
    print("❌ Failed: Could not find goal.")
