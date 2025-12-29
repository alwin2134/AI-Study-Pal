import json
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
METADATA_FILE = os.path.join(BASE_DIR, 'data', 'uploads_metadata.json')

def load_metadata():
    if not os.path.exists(METADATA_FILE):
        return {}
    try:
        with open(METADATA_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading metadata: {e}")
        return {}

def save_metadata(metadata):
    try:
        with open(METADATA_FILE, 'w') as f:
            json.dump(metadata, f, indent=4)
    except Exception as e:
        print(f"Error saving metadata: {e}")

def add_file_metadata(filename, original_name, bucket_name):
    metadata = load_metadata()
    metadata[filename] = {
        "original_name": original_name,
        "bucket_name": bucket_name,
        "uploaded_at": datetime.now().isoformat()
    }
    save_metadata(metadata)

def get_file_metadata(filename):
    metadata = load_metadata()
    return metadata.get(filename, {})

def get_files_in_bucket(bucket_name):
    metadata = load_metadata()
    return {
        fname: info 
        for fname, info in metadata.items() 
        if info.get('bucket_name') == bucket_name
    }
