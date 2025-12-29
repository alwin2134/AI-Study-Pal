
import sys
import subprocess
import os

print("--- GPU Diagnostic Tool ---")

# 1. Check PyTorch
try:
    import torch
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Available (Torch): {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device Name: {torch.cuda.get_device_name(0)}")
except ImportError:
    print("PyTorch not installed.")

# 2. Check NVIDIA-SMI
print("\n--- Checking nvidia-smi ---")
try:
    result = subprocess.run(['nvidia-smi'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode == 0:
        print("nvidia-smi: FOUND")
        print(result.stdout[:200].replace('\n', ' ')) # Print first few chars
    else:
        print("nvidia-smi: FAILED (Return Code != 0)")
except Exception as e:
    print(f"nvidia-smi: NOT FOUND ({e})")

# 3. Check CTransformers
print("\n--- Checking CTransformers ---")
try:
    from ctransformers import AutoModelForCausalLM
    print("CTransformers: Installed")
    
    # Try loading with GPU layers dry-run?
    model_path = os.path.join('backend', 'data', 'models', 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf')
    if os.path.exists(model_path):
        print(f"Model File: Found at {model_path}")
    else:
        print(f"Model File: NOT FOUND at {model_path}")
        
except ImportError:
    print("CTransformers: NOT INSTALLED")
