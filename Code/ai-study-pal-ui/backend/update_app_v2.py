
import os

new_main_block = """if __name__ == '__main__':
    # [NEW] Rehydrate RAG System from Supabase Storage on Startup
    try:
        print("--- Rehydrating RAG Index from Supabase Storage ---")
        from ml_utils import rag_system
        import shutil
        
        # Fetch all files from Supabase 'uploads' bucket (or DEFAULT_BUCKET)
        # Assuming one main bucket for now.
        try:
            files_list = supabase.list_files(bucket='uploads') 
            
            if not files_list:
                print("No files found in Supabase 'uploads' bucket.")
            else:
                queued = 0
                BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                temp_rehydrate_dir = os.path.join(BASE_DIR, 'data', 'temp_rehydrate')
                os.makedirs(temp_rehydrate_dir, exist_ok=True)

                for f in files_list:
                    fname = f.get('name')
                    # Skip folders or empty names
                    if not fname or fname.endswith('/'): continue
                    
                    print(f"DTO processing: {fname}")
                    
                    def rehydrate_worker(filename_arg):
                        try:
                            # Use default bucket 'uploads'
                            local_path = supabase.download_file(filename_arg, dest_path=os.path.join(temp_rehydrate_dir, filename_arg), bucket='uploads')
                            content = file_processor.extract_text_from_file(local_path)
                            if content:
                                rag_system.add_document(content, subject='Uncategorized', original_filename=filename_arg)
                            if os.path.exists(local_path):
                                os.remove(local_path)
                            print(f"Rehydrated: {filename_arg}")
                        except Exception as inner_e:
                            print(f"Failed to rehydrate {filename_arg}: {inner_e}")

                    # Option A: Run sequentially now (slow startup, but ready RAG)
                    # Option B: Background (fast startup, empty RAG initially)
                    # Going with Option B for responsiveness
                    background.submit_task(rehydrate_worker, fname)
                    queued += 1
                
                print(f"--- RAG Rehydration queued {queued} documents from Supabase. ---")

        except Exception as e:
            print(f"Supabase List/Rehydrate failed: {e}")

    except Exception as e:
        print(f"RAG Rehydration failed: {e}")

    # Run without the reloader to avoid double-starting heavy background work
    # and local LLM initialization. Use a production WSGI server for production.
    try:
        app.run(debug=False, port=5000, use_reloader=False)
    except Exception as e:
        with open("app_crash.log", "w") as f:
            import traceback
            traceback.print_exc(file=f)
        print(f"CRASH: {e}")
"""

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the main block
marker = "if __name__ == '__main__':"
idx = content.find(marker)

if idx != -1:
    new_content = content[:idx] + new_main_block
    with open('app.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated app.py")
else:
    print("Could not find main block marker")
