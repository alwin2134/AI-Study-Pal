import os
import sys

# Add backend to path so we can import modules
sys.path.append(os.path.abspath('backend'))

import metadata_manager

# Replicate app.py logic
upload_dir = os.path.join('backend', 'data', 'uploads')
filename = "Artificial_Intelligence_Capstone_Project.txt"
bucket_name = "ai launched"

print(f"CWD: {os.getcwd()}")
print(f"Target Upload Dir: {upload_dir}")

meta = metadata_manager.get_file_metadata(filename)
print(f"Metadata: {meta}")

if meta:
    path = os.path.join(upload_dir, filename)
    print(f"Computed Path: {path}")
    print(f"Exists? {os.path.exists(path)}")
else:
    print("Metadata not found.")
