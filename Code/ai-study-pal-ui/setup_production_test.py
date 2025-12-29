import requests
import os

# Content
science_text = "The Universe is exactly 13.8 billion years old. This is a specific fact for the Science bucket."
math_text = "The Golden Ratio is approximately 1.618. This is a specific fact for the Math bucket."

# Files
f_science = "cosmos_facts.txt"
f_math = "math_facts.txt"

with open(f_science, "w") as f:
    f.write(science_text)
    
with open(f_math, "w") as f:
    f.write(math_text)

url = "http://127.0.0.1:5000/api/upload"

def upload(file, bucket):
    files = {'file': open(file, 'rb')}
    data = {'bucketName': bucket}
    try:
        res = requests.post(url, files=files, data=data)
        print(f"Uploaded {file} to {bucket}: {res.status_code}")
    except Exception as e:
        print(f"Failed {file}: {e}")

# Upload
upload(f_science, "Science")
upload(f_math, "Math")

# Cleanup
os.remove(f_science)
os.remove(f_math)
