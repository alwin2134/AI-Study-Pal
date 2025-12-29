import sys
import os
# Add backend directory to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    print("Testing Imports...")
    import nltk
    from backend.ml_utils import quiz_gen
    from backend.llm_providers import get_provider
    print("Imports OK.")

    print("Testing POS Tagging...")
    try:
        nltk.data.find('taggers/averaged_perceptron_tagger')
    except LookupError:
        print("POS Tagger NOT found. Downloading...")
        nltk.download('averaged_perceptron_tagger')
    
    text = "Photosynthesis is the process used by plants."
    print(f"Generating Quiz for: {text}")
    q = quiz_gen.generate_quiz(text=text, num_questions=1)
    print(f"Quiz Result: {q}")

    print("Testing Provider...")
    llm = get_provider("local")
    print("Provider OK.")

except Exception as e:
    import traceback
    traceback.print_exc()
