from ml_utils import quiz_pipeline

def test():
    print("--- Testing Quiz Generation from DATASET ---")
    topic = "Physics"
    num = 5
    
    try:
        print(f"Generating for {topic}...")
        result, status = quiz_pipeline.run_quiz_from_dataset(topic, num)
        print(f"Status: {status}")
        if status == 200:
            qs = result.get('questions', [])
            print(f"Generated {len(qs)} questions.")
            if not qs:
                print("WARNING: Questions list is empty.")
            else:
                print(f"Sample Question: {qs[0]}")
        else:
            print(f"Error: {result}")
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test()
