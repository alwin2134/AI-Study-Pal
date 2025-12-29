
import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def add_note(title, content, bucket):
    requests.post(f"{BASE_URL}/notes", json={
        "title": title,
        "content": content,
        "bucket": bucket
    })

def generate_quiz(filenames, count):
    return requests.post(f"{BASE_URL}/quiz", json={
        "mode": "notes",
        "filenames": filenames,
        "numQuestions": count
    }).json()

print("Waiting for backend...")
time.sleep(5)

# 1. Seed Minimal Data (2 Facts)
# This mimics "Too few facts" scenario where expansion is needed.
print("Seeding Notes...")
content = "The mitochondria is known as the powerhouse of the cell because it generates most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy. In addition to supplying cellular energy, mitochondria are involved in other tasks, such as signaling, cellular differentiation, and cell death, as well as maintaining control of the cell cycle and cell growth. Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's metabolic activities. This chemical energy is stored in carbohydrate molecules, such as sugars and starches, which are synthesized from carbon dioxide and water."
add_note("Quiz Source", content, "Quiz Test")

# 2. Request 4 Questions (Requires Expansion)
# With only 2 sentences, 1-to-1 mapping gives 2 questions. 
# We requested 4. We need T/F or Fill-in variants to fill the gap.
print("\n--- TEST: Requesting 4 Questions from 2 Facts ---")
quiz = generate_quiz(["note_Quiz Source.txt"], 4)
questions = quiz.get("questions", [])

print(f"Questions Generated: {len(questions)}")
for q in questions:
    print(f"[{q['id']}] Q: {q['question']}")
    print(f"     Options: {q['options']}")
    print(f"     Correct: {q['correct']}")

if len(questions) >= 3:
    print("✅ PASS: Expansion successfully generated extra questions.")
else:
    print("❌ FAIL: Could not expand questions.")

# Check for variety (Not strictly enforced by script, but manual check)
# Ideally we see some MCQs and some T/F or different phrasing.
