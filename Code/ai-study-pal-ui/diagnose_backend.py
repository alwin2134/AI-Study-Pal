
import sys
import os
import traceback

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

print("Attempting to import app...")
try:
    from backend import app
    print("SUCCESS: Imported app")
except Exception:
    traceback.print_exc()

print("\nAttempting to import ml_utils...")
try:
    from backend import ml_utils
    print("SUCCESS: Imported ml_utils")
    
    print("\nTesting AIPipeline instantiation...")
    res = ml_utils.ai_pipeline.run_chat_ai("Hello", "local", {})
    print(f"AIPipeline Result: {res}")
    
except Exception:
    traceback.print_exc()
