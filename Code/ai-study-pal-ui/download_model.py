
import os
import requests
from tqdm import tqdm

MODEL_URL = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf"
DEST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'data', 'models')
DEST_FILE = os.path.join(DEST_DIR, 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf')

def download_model():
    if os.path.exists(DEST_FILE):
        print(f"Model already exists at {DEST_FILE}")
        return

    os.makedirs(DEST_DIR, exist_ok=True)
    print(f"Downloading model to {DEST_FILE}...")
    
    response = requests.get(MODEL_URL, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(DEST_FILE, 'wb') as file, tqdm(
        desc=DEST_FILE,
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for data in response.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)
            
    print("Download complete!")

if __name__ == "__main__":
    download_model()
