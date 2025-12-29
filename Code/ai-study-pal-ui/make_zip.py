import zipfile
import os

def zip_project():
    output_filename = "AI_Study_Pal_Final_Submission.zip"
    
    # Folders to include recursively
    include_folders = [
        "backend",
        "src",
        "public",
        "submission_docs"
    ]
    
    # Specific files to include in root
    include_files = [
        "README.md",
        "requirements.txt",
        "package.json",
        "vite.config.ts",
        "tsconfig.json",
        "tsconfig.app.json",
        "tsconfig.node.json",
        "index.html",
        "postcss.config.js",
        "tailwind.config.ts",
        ".env.example" # If exists, otherwise skip
    ]
    
    # Exclude patterns (just in case)
    exclude_dirs = {"__pycache__", "node_modules", ".git", ".venv", "dist"}
    exclude_exts = {".pyc", ".log", ".zip"}

    print(f"Creating {output_filename}...")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for f in include_files:
            if os.path.exists(f):
                print(f"Adding file: {f}")
                zipf.write(f, arcname=f)
            else:
                print(f"Skipping missing file: {f}")
        
        # Add folders
        for folder in include_folders:
            if not os.path.exists(folder):
                print(f"Skipping missing folder: {folder}")
                continue
                
            for root, dirs, files in os.walk(folder):
                # Filter exclusions in-place
                dirs[:] = [d for d in dirs if d not in exclude_dirs]
                
                for file in files:
                    if any(file.endswith(ext) for ext in exclude_exts):
                        continue
                        
                    file_path = os.path.join(root, file)
                    # Archive name should be relative
                    arcname = os.path.relpath(file_path, ".")
                    print(f"Adding: {arcname}")
                    zipf.write(file_path, arcname)

    print("Zip created successfully.")

if __name__ == "__main__":
    zip_project()
