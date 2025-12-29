
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from dotenv import load_dotenv
load_dotenv()
from backend.supabase_client import delete_note

# IDs from count.txt
IDS_TO_DELETE = [
    "ec0b4991-a231-4248-9163-08f02bd1852b",
    "b32535c8-f6a7-4468-a07d-2a51b2f9b3cb"
]

def force_delete():
    print("--- Force Deleting Remaining Notes ---")
    for nid in IDS_TO_DELETE:
        try:
            print(f"Deleting {nid}...")
            delete_note(nid)
            print("Success.")
        except Exception as e:
            print(f"Failed: {e}")

if __name__ == "__main__":
    force_delete()
