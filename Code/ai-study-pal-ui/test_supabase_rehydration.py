
import os
import sys
import requests
import json

# Add backend to path to import modules
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.getcwd(), '.env'))

try:
    import supabase_client as supabase
    print("Supabase Config:")
    print(f"URL: {supabase.SUPABASE_URL}")
    # Test list buckets to verify auth and existence
    print("\n[DEBUG] Listing Buckets...")
    buckets_url = f"{supabase.SUPABASE_URL.rstrip('/')}/storage/v1/bucket"
    headers = supabase._auth_headers()
    r_buckets = requests.get(buckets_url, headers=headers)
    print(f"Buckets Response ({r_buckets.status_code}): {r_buckets.text}")

    print("\n[DEBUG] Listing files in 'uploads' bucket...")
    try:
        files = supabase.list_files(bucket='uploads')
        print(f"Found {len(files)} files.")
        for f in files[:5]:
            print(f" - {f.get('name')}")
    except Exception as e:
        print(f"List Files Failed: {e}")
        
    # Check if 'uploads' exists in buckets
    bucket_exists = False
    if r_buckets.status_code == 200:
        opts = [b['name'] for b in r_buckets.json()]
        print(f"Available buckets: {opts}")
        if 'uploads' in opts:
            bucket_exists = True
    
    if not bucket_exists:
        print("\n[DEBUG] 'uploads' bucket MISSING. Attempting to create...")
        create_url = f"{supabase.SUPABASE_URL.rstrip('/')}/storage/v1/bucket"
        payload = {"name": "uploads", "public": False} 
        r_create = requests.post(create_url, headers=headers, json=payload)
        print(f"Create Bucket Response ({r_create.status_code}): {r_create.text}")
        if r_create.status_code == 200:
            print("Bucket created.")


    # 3. Test Upload (Write Check)
    print("\n[DEBUG] Testing Upload...")
    dummy_filename = "test_upload_probe.txt"
    dummy_content = b"Supabase Write Check"
    try:
        # We need to use the upload_file function but it expects a file-like object
        import io
        f_obj = io.BytesIO(dummy_content)
        path = supabase.upload_file(f_obj, dummy_filename, bucket='uploads')
        print(f"Upload Successful: {path}")
        
        # 4. Test Download (Read Check)
        print("\n[DEBUG] Testing Download...")
        dl_path = supabase.download_file(dummy_filename, dest_path=f"local_{dummy_filename}", bucket='uploads')
        print(f"Download Successful: {dl_path}")
        
        # Cleanup
        if os.path.exists(dl_path): os.remove(dl_path)
    except Exception as e:
        print(f"Upload/Download Failed: {e}")
        # Print detailed response if available in exception




except Exception as e:
    print(f"Test Failed: {e}")
    import traceback
    traceback.print_exc()
