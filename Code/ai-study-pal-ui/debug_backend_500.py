import sys
import os
from dotenv import load_dotenv

sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Load env from root
load_dotenv()

try:
    print("Testing Supabase Client connection...")
    import supabase_client as sb
    
    print("Fetching Buckets...")
    buckets = sb.fetch_note_buckets()
    print(f"Buckets: {buckets}")
    
    print("Fetching Notes...")
    notes = sb.fetch_notes()
    print(f"Notes Count: {len(notes)}")
    
except Exception as e:
    import traceback
    traceback.print_exc()
