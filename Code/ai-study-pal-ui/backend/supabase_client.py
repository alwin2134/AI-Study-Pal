import os
import requests

SUPABASE_URL = os.environ.get('SUPABASE_URL') or os.environ.get('VITE_SUPABASE_URL')
# Prefer Service Role key if available, else Anon Key
SUPABASE_KEY = os.environ.get('SUPABASE_KEY') or os.environ.get('VITE_SUPABASE_ANON_KEY') or os.environ.get('VITE_SUPABASE_PUBLISHABLE_KEY')
DEFAULT_BUCKET = os.environ.get('SUPABASE_BUCKET', 'uploads')


def _auth_headers():
    headers = {}
    if SUPABASE_KEY:
        headers['apikey'] = SUPABASE_KEY
        headers['Authorization'] = f'Bearer {SUPABASE_KEY}'
    return headers


def upload_file(file_obj, file_name: str, bucket: str = None) -> str:
    """Upload a file object to Supabase Storage. Returns the key/path."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError('Supabase not configured (SUPABASE_URL/SUPABASE_KEY).')

    bucket = bucket or DEFAULT_BUCKET
    # URL: {SUPABASE_URL}/storage/v1/object/{bucket}/{path}
    url = SUPABASE_URL.rstrip('/') + f"/storage/v1/object/{bucket}/{file_name}"
    
    headers = _auth_headers()
    # Content-Type is usually handled by requests if we pass files parameter, 
    # but here we might be passing raw bytes or a file-like object.
    # We'll use the 'data' parameter for binary content.
    
    # Reset file pointer if possible
    if hasattr(file_obj, 'seek'):
        file_obj.seek(0)
    
    files = { 'file': (file_name, file_obj) }

    # For Supabase Storage, we typically post strictly to the URL.
    # The `requests` library handles multipart/form-data when using `files`.
    # However, sometimes Supabase expects raw binary in body with correct content-type header
    # if using the `file` vs `object` endpoint. 
    # The standard POST to /object/{bucket}/{path} expects the file body.
    
    # Let's try sending raw bytes if it's a file-like object.
    file_content = file_obj.read()
    
    # We need to set the Content-Type. Let's try generic octet-stream or let Supabase guess.
    # Ideally we'd know the mime type.
    headers['Content-Type'] = 'application/octet-stream'
    
    r = requests.post(url, headers=headers, data=file_content)
    
    if r.status_code not in (200, 201):
        raise RuntimeError(f"Failed to upload {file_name} to Supabase: {r.status_code} {r.text}")
        
    return f"{bucket}/{file_name}"


def download_file(file_name: str, dest_path: str = None, bucket: str = None) -> str:
    """Download a file from Supabase Storage to dest_path. Returns local path or raises."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError('Supabase not configured (SUPABASE_URL/SUPABASE_KEY).')

    bucket = bucket or DEFAULT_BUCKET
    # Build object endpoint. Using storage object path which requires auth.
    # URL: {SUPABASE_URL}/storage/v1/object/{bucket}/{path}
    url = SUPABASE_URL.rstrip('/') + f"/storage/v1/object/{bucket}/{file_name}"

    headers = _auth_headers()
    r = requests.get(url, headers=headers, stream=True)
    if r.status_code != 200:
        # Try public path
        pub_url = SUPABASE_URL.rstrip('/') + f"/storage/v1/object/public/{bucket}/{file_name}"
        r2 = requests.get(pub_url, stream=True)
        if r2.status_code == 200:
            r = r2
        else:
            raise RuntimeError(f"Failed to download {file_name} from Supabase: {r.status_code} {r.text}")

    if not dest_path:
        # default to a temporary file under current dir
        dest_path = os.path.join(os.path.dirname(__file__), 'data', 'uploads', file_name)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    with open(dest_path, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    return dest_path


def list_files(bucket: str = None, prefix: str = None):
    """List files in a Supabase storage bucket. Returns JSON list or raises."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError('Supabase not configured (SUPABASE_URL/SUPABASE_KEY).')
    bucket = bucket or DEFAULT_BUCKET
    url = SUPABASE_URL.rstrip('/') + f"/storage/v1/object/list/{bucket}"
    headers = _auth_headers()
    headers['Content-Type'] = 'application/json'
    
    
    payload = {
        "prefix": prefix or "",
        "limit": 100,
        "offset": 0,
        "sortBy": {
            "column": "name",
            "order": "desc"
        }
    }
        
    r = requests.post(url, headers=headers, json=payload)
    
    if r.status_code != 200:
        raise RuntimeError(f"Failed to list files: {r.status_code} {r.text}")
    return r.json()


def fetch_notes(bucket_id: str = None):
    """Fetch text notes from the 'notes' table via REST API."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError('Supabase not configured.')
    
    url = SUPABASE_URL.rstrip('/') + "/rest/v1/notes"
    headers = _auth_headers()
    params = {
        "select": "id,title,content,bucket_id,user_id",
        "order": "created_at.desc"
    }
    if bucket_id:
        params["bucket_id"] = f"eq.{bucket_id}"
        
    r = requests.get(url, headers=headers, params=params)
    if r.status_code != 200:
        raise RuntimeError(f"Failed to fetch notes: {r.status_code} {r.text}")
    return r.json()

def fetch_note_buckets():
    """Fetch all note buckets to map names to IDs."""
    if not SUPABASE_URL or not SUPABASE_KEY:
         raise RuntimeError('Supabase not configured.')
         
    url = SUPABASE_URL.rstrip('/') + "/rest/v1/note_buckets"
    headers = _auth_headers()
    params = {"select": "id,name"}
    
    r = requests.get(url, headers=headers, params=params)
    if r.status_code != 200:
        return []
    return r.json()

def get_note_content_by_id(note_id: str):
    """Fetch content of a single note by ID."""
    if not SUPABASE_URL or not SUPABASE_KEY:
         raise RuntimeError('Supabase not configured.')
         
    url = SUPABASE_URL.rstrip('/') + f"/rest/v1/notes"
    headers = _auth_headers()
    params = {
        "select": "content",
        "id": f"eq.{note_id}",
        "limit": 1
    }
    
    r = requests.get(url, headers=headers, params=params)
    if r.status_code != 200:
        return None
        
    data = r.json()
    if data and len(data) > 0:
        return data[0].get('content')
    return None

def get_note_details(note_id: str):
    """Fetch full details of a single note by ID."""
    if not SUPABASE_URL or not SUPABASE_KEY:
         raise RuntimeError('Supabase not configured.')
         
    url = SUPABASE_URL.rstrip('/') + f"/rest/v1/notes"
    headers = _auth_headers()
    params = {
        "select": "*",
        "id": f"eq.{note_id}",
        "limit": 1
    }
    
    r = requests.get(url, headers=headers, params=params)
    if r.status_code != 200:
        return None
        
    data = r.json()
    if data and len(data) > 0:
        return data[0]
    return None

def update_note_content(note_id: str, content: str):
    """Update content of a note by ID."""
    if not SUPABASE_URL or not SUPABASE_KEY:
         raise RuntimeError('Supabase not configured.')
         
    url = SUPABASE_URL.rstrip('/') + f"/rest/v1/notes?id=eq.{note_id}"
    headers = _auth_headers()
    headers['Content-Type'] = 'application/json'
    # Use Prefer header for return=representation if needed, or minimal
    
    payload = {"content": content}
    
    r = requests.patch(url, headers=headers, json=payload)
    if r.status_code not in (200, 204):
        raise RuntimeError(f"Failed to update note: {r.status_code} {r.text}")
    return True

def delete_note(note_id: str):
    """Delete a note by ID."""
    if not SUPABASE_URL or not SUPABASE_KEY:
         raise RuntimeError('Supabase not configured.')
         
    url = SUPABASE_URL.rstrip('/') + f"/rest/v1/notes?id=eq.{note_id}"
    headers = _auth_headers()
    
    r = requests.delete(url, headers=headers)
    if r.status_code not in (200, 204):
        raise RuntimeError(f"Failed to delete note: {r.status_code} {r.text}")
    return True

def create_note(note_data: dict):
    """Create a new note."""
    if not SUPABASE_URL or not SUPABASE_KEY:
         raise RuntimeError('Supabase not configured.')
         
    url = SUPABASE_URL.rstrip('/') + "/rest/v1/notes"
    headers = _auth_headers()
    headers['Content-Type'] = 'application/json'
    headers['Prefer'] = 'return=representation'
    
    r = requests.post(url, headers=headers, json=note_data)
    if r.status_code != 201:
        raise RuntimeError(f"Failed to create note: {r.status_code} {r.text}")
    return r.json()
