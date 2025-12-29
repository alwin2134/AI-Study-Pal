import requests
import os

# Content equivalent to what user sees in UI
content_capstone = """
Artificial Intelligence Capstone Project Overview.
Goal: Build a comprehensive AI Study Pal.
Features: 
1. Note Management (Buckets).
2. AI Chat (RAG) with strict filtering.
3. Quiz Generation.
4. Summarization.
Tech Stack: React, Flask, Supabase.
"""

content_guidelines = """
Capstone Project Submission Guidelines (Nov 2025).
1. Submit code via GitHub.
2. Include a video walkthrough.
3. Deadline: November 30th, 2025.
4. Formatting: Use standard project structure.
"""

files = {
    "Artificial_Intelligence_Capstone_Project.txt": content_capstone,
    "Capstone_Project_Submission_Guidelines_Nov_2025.txt": content_guidelines
}

url = "http://127.0.0.1:5000/api/upload"
bucket = "ai launched"

print(f"Starting sync to bucket: '{bucket}'...")

for filename, content in files.items():
    print(f"Processing {filename}...")
    try:
        # Create temp file
        with open(filename, "w", encoding='utf-8') as f:
            f.write(content)
        
        # Upload
        print(f"  Uploading...")
        with open(filename, 'rb') as f_upload:
            upload_files = {'file': f_upload}
            data = {'bucketName': bucket}
            res = requests.post(url, files=upload_files, data=data)
            
        if res.status_code == 200:
            print(f"  ✅ Indexed successfully.")
        else:
            print(f"  ❌ Failed: {res.status_code} - {res.text}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
    finally:
        if os.path.exists(filename):
            os.remove(filename)

print("Sync completed.")
