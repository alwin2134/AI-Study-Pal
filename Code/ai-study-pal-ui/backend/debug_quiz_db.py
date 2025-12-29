import os
from dotenv import load_dotenv

# Load env from parent dir (standard for this project)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

import supabase_client as supabase

def test():
    print("--- Testing Fetch Notes for FILE ---")
    try:
        notes = supabase.fetch_notes()
        file_note = None
        for n in notes:
             # We need to check if it has a file_path. 
             # fetch_notes returns id, title, content, bucket_id, user_id.
             # It does NOT return file_path default? 
             # Wait, app.py fetch_notes params: "select": "id,title,content,bucket_id,user_id"
             # So I cannot see file_path from fetch_notes! 
             # I need to use get_note_details on them to check? Or just check content for [Indexed for AI]
             if "[Indexed for AI]" in n.get('content', ''):
                 file_note = n
                 break
        
        if not file_note:
            print("No file-based notes found (checked for [Indexed for AI]).")
            # Try just the first note then
            if notes: file_note = notes[0]
            else: return

        tid = file_note['id']
        print(f"Target Note ID: {tid} Title: {file_note.get('title')}")

        print("--- Testing Get Note Details ---")
        details = supabase.get_note_details(tid)
        if not details:
            print("FAILED: get_note_details returned None")
            return
            
        print(f"Details found. File Path: {details.get('file_path')}")
        
        fpath = details.get('file_path')
        if fpath:
             print(f"Attempting download of {fpath}...")
             try:
                 local_name = os.path.basename(fpath)
                 local = supabase.download_file(fpath, dest_path=local_name, bucket='uploads')
                 print(f"Download success to {local}")
                 if os.path.exists(local):
                     print(f"File size: {os.path.getsize(local)}")
                     
                     # Test Extraction
                     import file_processor
                     print("Attempting extraction...")
                     text = file_processor.extract_text_from_file(local)
                     print(f"Extraction result length: {len(text)}")
                     print(f"Snippet: {text[:100]}")
                     
                     os.remove(local)
             except Exception as e:
                 print(f"Download/Extraction FAILED: {e}")
                 import traceback
                 traceback.print_exc()
        else:
             print("Note has no file_path. It is a text note.")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
