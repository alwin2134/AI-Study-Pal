from ml_utils import rag_system
import data_manager

# Ensure data is loaded
df = data_manager.load_data()
print(f"Data Loaded: {len(df)} rows")

# Index documents
rag_system.index_documents()

# Test Query
question = "What is Photosynthesis?"
print(f"Testing Question: {question}")
answer, sources = rag_system.query(question)
print(f"Answer: {answer}")
print(f"Sources: {sources}")

# Test Query 2
question = "Tell me about the French Revolution"
print(f"Testing Question: {question}")
answer, sources = rag_system.query(question)
print(f"Answer: {answer}")
print(f"Sources: {sources}")
