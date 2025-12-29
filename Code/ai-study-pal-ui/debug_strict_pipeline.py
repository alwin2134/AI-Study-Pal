
import sys
import os
import json
sys.path.append(os.path.join(os.getcwd(), 'backend'))

def test_fact_extraction():
    print("\n--- Testing Fact Extraction ---")
    from backend.ml_utils import fact_extractor
    text = "Mitochondria is the powerhouse of the cell. It generates most of the chemical energy needed to power the cell's biochemical reactions. Maybe it is important."
    facts = fact_extractor.extract_facts(text)
    print(f"Text: {text}")
    print(f"Extracted Facts: {facts}")
    if len(facts) >= 2 and "Maybe" not in facts[0]:
        print("PASS: Extracted strong facts only.")
    else:
        print("FAIL: Weak sentence included or extraction failed.")

def test_router_logic():
    print("\n--- Testing Router Logic ---")
    from backend.app import route_request
    
    # Test 1: Quiz from Notes (Strict)
    print("Test 1: Quiz Notes (Valid)")
    # We need a dummy file for this to return 200, mock it? 
    # Just checking if it hits the pipeline logic.
    res, status = route_request('quiz', {'filenames': ['dummy.pdf'], 'numQuestions': 5})
    # Expect 400 because file doesn't exist, but NOT "Unknown feature"
    print(f"Status: {status}, Response: {res}")
    if status == 400 and "empty or unreadable" in res.get('error', ''):
        print("PASS: Router hit Quiz Notes Pipeline (and failed gracefully).")
    else:
        print("FAIL: Router logic unexpected.")

    # Test 2: Quiz Mixed Mode (Fail)
    print("Test 2: Quiz Mixed (Invalid 'My Notes' topic)")
    res, status = route_request('quiz', {'topic': 'My Notes', 'numQuestions': 5})
    print(f"Status: {status}, Response: {res}")
    if status == 400 and "Invalid request" in res.get('error', ''):
         print("PASS: Router rejected implicit notes mode.")
    else:
         print("FAIL: Router allowed implicit notes.")

if __name__ == "__main__":
    try:
        test_fact_extraction()
        test_router_logic()
    except Exception as e:
        import traceback
        traceback.print_exc()
