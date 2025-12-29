
import pandas as pd
import numpy as np
import random
import re
import os
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from embeddings import get_embeddings_instance
from llm_providers import get_provider
import data_manager
import file_processor
import metadata_manager
import supabase_client as supabase

# --- LangChain Imports ---
try:
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_community.vectorstores import FAISS
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_core.documents import Document
    LANGCHAIN_AVAILABLE = True
except ImportError as e:
    LANGCHAIN_AVAILABLE = False
    print(f"Warning: LangChain not found. RAG will fail. Error: {e}")

# Ensure NLTK data
def check_nltk():
    resources = ['punkt', 'stopwords', 'averaged_perceptron_tagger', 'averaged_perceptron_tagger_eng']
    for r in resources:
        try:
            if r == 'punkt':
                nltk.data.find(f'tokenizers/{r}')
            elif r == 'stopwords':
                nltk.data.find(f'corpora/{r}')
            else:
                nltk.data.find(f'taggers/{r}')
        except LookupError:
            print(f"Downloading NLTK resource: {r}")
            nltk.download(r)
check_nltk()

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("Warning: TensorFlow not found. DL Summarizer will use mock mode.")

# --- Legacy/Helper Classes ---
class QuizGenerator:
    def __init__(self):
        self.vectorizer = CountVectorizer()
        self.classifier = LogisticRegression(max_iter=1000)
        self.cluster_model = KMeans(n_clusters=3, random_state=42)
        self.tfidf = TfidfVectorizer()
        self.is_trained = False

    def train_models(self):
        df = data_manager.load_data()
        if df.empty: return
        df['difficulty'] = df['text'].apply(lambda x: 0 if len(str(x).split()) < 15 else 1)
        X = df['text']
        y = df['difficulty']
        self.vectorizer.fit(X)
        self.classifier.fit(self.vectorizer.transform(X), y)
        self.tfidf.fit(X)
        self.cluster_model.fit(self.tfidf.transform(X))
        self.is_trained = True
        print("Quiz Model Trained.")

    def get_text_by_subject(self, subject):
        df = data_manager.load_data() 
        if df.empty: return ""
        sub = df[df['subject'].str.contains(subject, case=False, na=False)]
        return " ".join(df['text'].tolist()) if sub.empty else " ".join(sub['text'].tolist())
    
    def suggest_resources(self, text):
        if not self.is_trained: self.train_models()
        vec = self.tfidf.transform([text])
        cluster = self.cluster_model.predict(vec)[0]
        return [{"title": f"Resource Group {cluster}", "link": "#"}]

# --- LangChain RAG System ---

class RAGSystem:
    def __init__(self, emb_model_name: str = 'all-MiniLM-L6-v2'):
        if not LANGCHAIN_AVAILABLE:
            self.vectorstore = None
            return

        try:
            # Initialize Embeddings
            self.embeddings = HuggingFaceEmbeddings(model_name=emb_model_name)
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=800,
                chunk_overlap=100,
                length_function=len
            )
            self.vectorstore = None 
            self.is_indexed = False
        except Exception as e:
            print(f"Failed to init LangChain RAG: {e}")
            self.vectorstore = None

    def add_document(self, text: str, subject: str = "Uncategorized", original_filename: str = "Uploaded File"):
        if not LANGCHAIN_AVAILABLE: return 0
        
        # Split Text
        texts = self.text_splitter.split_text(text)
        metadatas = [{"bucket": subject, "filename": original_filename} for _ in texts]
        
        # Create or Update Vector Store
        if self.vectorstore is None:
            self.vectorstore = FAISS.from_texts(texts, self.embeddings, metadatas=metadatas)
        else:
            self.vectorstore.add_texts(texts, metadatas=metadatas)
             
        self.is_indexed = True
        return len(texts)

    def query(self, query_text: str, subject_filter: str = None, llm_module=None, top_k: int = 3):
        if not LANGCHAIN_AVAILABLE or not self.vectorstore:
            return "RAG System Unavailable (LangChain missing or empty).", []
        
        # 1. Config Filters
        search_kwargs = {"k": 5} # Fetch more initially for filtering
        if subject_filter and subject_filter != 'All Notes':
             search_kwargs["filter"] = {"bucket": subject_filter}

        # 2. Retrieve Documents with Scores
        print(f"[RAG] Query: {query_text} | Filter: {search_kwargs}")
        
        # Use relevance scores (0-1) where possible. 
        # Note: FAISS relevance scores + HuggingFace typically normalize L2 or Cosine.
        # Threshold: 0.7 (Recommended)
        docs_and_scores = self.vectorstore.similarity_search_with_relevance_scores(query_text, **search_kwargs)
        
        # DEBUG: Bucket Filtering Check
        # print(f"[RAG-DEBUG] Active bucket: {subject_filter}")
        # print(f"[RAG-DEBUG] Applied filter: {search_kwargs.get('filter')}")
        # print(f"[RAG-DEBUG] Retrieved metadata: {[d.metadata for d, _ in docs_and_scores]}")
        
        # 3. Strict Relevance Filtering
        SCORE_THRESHOLD = 0.0 # lowered to 0.0 to unblock retrieval; scores were negative
        filtered_docs = []
        for doc, score in docs_and_scores:
            print(f"[RAG] Doc: {doc.metadata.get('filename')} | Score: {score:.3f}")
            if score >= SCORE_THRESHOLD:
                filtered_docs.append((doc, score))
        
        # 4. Sorting & Truncation
        # Sort by score desc
        filtered_docs.sort(key=lambda x: x[1], reverse=True)
        # Top 2 Chunks Only
        filtered_docs = filtered_docs[:2]
        
        # 5. Strict Failure Handling (Empty Context)
        if not filtered_docs:
            print("[RAG] No docs met threshold -> NOT_IN_NOTES")
            return "NOT_IN_NOTES", []

        # 6. Context Construction (Word Limit)
        final_docs = [d[0] for d in filtered_docs]
        raw_context = "\n\n".join([d.page_content for d in final_docs])
        # Truncate to ~350 words
        context_words = raw_context.split()
        if len(context_words) > 350:
            context_text = " ".join(context_words[:350]) + "..."
        else:
            context_text = raw_context
            
        print(f"[RAG] Final Context ({len(filtered_docs)} chunks, {len(context_text.split())} words): {context_text[:200]}...")

        if llm_module:
            # Tuned Prompt: Strict Answer Scope
            # Removed "Answer:" suffix as it's handled by LLM provider templates usually
            # Tuned Prompt: Strict Answer Scope with ChatML
            prompt = (
                "<|system|>\n"
                "You are an AI Study Pal. Answer the question based ONLY on the provided context.\n"
                "If the context is missing or irrelevant, say 'NOT_IN_NOTES'.\n"
                "Do NOT start your response with 'Question:'. Direct answer only.\n"
                "</s>\n"
                "<|user|>\n"
                f"Context:\n{context_text}\n\n"
                f"Question: {query_text}\n"
                "</s>\n"
                "<|assistant|>\n"
            )

            # Use existing provider
            answer = llm_module.generate(prompt, max_tokens=200)
        else:
            answer = "LLM Provider Unavailable."

        # 7. Verify Output
        if "NOT_IN_NOTES" in answer:
             return "NOT_IN_NOTES", []

        sources = list(set([d.metadata.get('filename', 'Unknown') for d in final_docs]))
        return answer, sources

class DLSummarizer:
    def __init__(self):
        if TF_AVAILABLE:
            self.model = keras.Sequential([
                layers.Dense(64, activation='relu', input_shape=(10,)),
                layers.Dense(1, activation='sigmoid')
            ])
            self.model.compile(optimizer='adam', loss='binary_crossentropy')
    def summarize(self, text):
        sentences = text.split('.')
        return ". ".join([s for s in sentences if len(s.split())>5][:2]) + "."

# --- 1. Fact Extraction for Quiz Quality ---
class FactExtractor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        self.fact_cache = {} 

    def is_weak_sentence(self, sent):
        tokens = word_tokenize(sent)
        if len(tokens) < 6: return True 
        if "?" in sent: return True 
        weak_words = ['should', 'maybe', 'think', 'believe', 'feel', 'probably']
        if any(w in sent.lower() for w in weak_words): return True
        return False

    def extract_facts(self, text, limit=10):
        sentences = sent_tokenize(text)
        candidates = []
        for sent in sentences:
            sent = sent.strip()
            if self.is_weak_sentence(sent): continue
            score = 0
            if " is " in sent or " are " in sent: score += 2 
            if " because " in sent: score += 1
            if " leads to " in sent: score += 1
            candidates.append((score, sent))
        candidates.sort(key=lambda x: x[0], reverse=True)
        return [c[1] for c in candidates[:limit]]

    def generate_question_from_fact(self, fact, text_context):
        tokens = word_tokenize(fact)
        tagged = nltk.pos_tag(tokens)
        candidates = [w for w, t in tagged 
                      if len(w) > 3 and w.lower() not in self.stop_words 
                      and (t.startswith('NN') or t.startswith('JJ'))]
        if not candidates: return None
        target_word = random.choice(candidates)
        pattern = re.compile(re.escape(target_word), re.IGNORECASE)
        question_text = pattern.sub("______", fact, count=1)
        all_tokens = [w for w in word_tokenize(text_context) 
                      if w.isalnum() and len(w) > 3 and w.lower() not in self.stop_words]
        distractors = list(set([w for w in all_tokens if w.lower() != target_word.lower()]))
        if len(distractors) < 3:
            distractors = ["Option A", "Option B", "Option C"]
        else:
            distractors = random.sample(distractors, 3)
        options = [target_word] + distractors
        random.shuffle(options)
        return {
            "question": question_text,
            "options": options,
            "correct": options.index(target_word),
            "difficulty": "Medium" if len(fact.split()) > 10 else "Easy"
        }

fact_extractor = FactExtractor()

# --- 2. Quiz Pipeline (Strict Mode Separation) ---
class QuizPipeline:
    def __init__(self):
        self.quiz_gen = QuizGenerator()

    def generate_llm_question(self, fact, q_type="mcq"):
        from llm_providers import local_llm
        # Use local_llm directly (SmartLoader instance)
        provider = local_llm
        
        type_desc = "Multiple Choice Question (MCQ)"
        if q_type == "tf": type_desc = "True/False Question"
        if q_type == "fib": type_desc = "Fill-in-the-Blank Question"
        
        prompt = (
            f"FACT: \"{fact}\"\n\n"
            f"Task: Create a {type_desc} based ONLY on the fact above.\n\n"
            "Rules:\n"
            "- Use ONLY words/concepts from the fact.\n"
            "- No new info.\n"
            "- Output format:\n"
            "Question: ...\n"
            "Option A: ...\n"
            "Option B: ...\n"
            "Option C: ...\n"
            "Correct: ... (The full correct option text)\n"
        )
        
        try:
            # Generate
            response = provider.generate(prompt, max_tokens=150)
            
            # Simple Text Parsing
            lines = response.split('\n')
            question_text = ""
            options = []
            correct = ""
            
            for line in lines:
                line = line.strip()
                if line.startswith("Question:"):
                    question_text = line.replace("Question:", "").strip()
                elif line.startswith("Option"):
                    parts = line.split(":", 1)
                    if len(parts) > 1:
                        options.append(parts[1].strip())
                elif line.startswith("Correct:"):
                    correct = line.replace("Correct:", "").strip()
            
            # Validation
            if not question_text or not options or not correct:
                print(f"[QuizPipeline] Parsing Failed. Raw Response:\n{response}")
                return None
                
            # For T/F, ensure 2 options. For MCQ/FIB, usually 3-4. 
            # If LLM gave fewer than 2 options, fail.
            if len(options) < 2: return None
            
            # Determine correct index
            correct_idx = -1
            for i, opt in enumerate(options):
                if opt.lower() in correct.lower() or correct.lower() in opt.lower():
                    correct_idx = i
                    break
            
            if correct_idx == -1: return None # Could not match correct answer
            
            return {
                "question": question_text,
                "options": options,
                "correct": correct_idx,
                "difficulty": "Medium"
            }
        except Exception as e:
            print(f"LLM Quiz Gen Failed: {e}")
            return None

    def run_quiz_from_notes(self, filenames, num_questions):
        # filenames argument actually contains Note IDs from the frontend
        note_ids = filenames
        print(f"[QuizPipeline] Notes Mode: IDs {note_ids}")
        combined_text = ""
        
        for note_id in note_ids:
            try:
                # 1. Fetch Full Note Details
                note = supabase.get_note_details(note_id)
                if not note:
                    print(f"[QuizPipeline] Note {note_id} not found in DB.")
                    continue
                
                # 2. Check for File Path (Uploaded Document)
                file_path = note.get('file_path')
                if file_path:
                    print(f"[QuizPipeline] Downloading file: {file_path}")
                    # Download to temp
                    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__)) 
                    temp_dir = os.path.join(BACKEND_DIR, 'data', 'temp_quiz')
                    os.makedirs(temp_dir, exist_ok=True)
                    
                    local_fname = os.path.basename(file_path)
                    local_path = os.path.join(temp_dir, local_fname)
                    
                    try:
                        supabase.download_file(file_path, dest_path=local_path, bucket='uploads')
                        extracted = file_processor.extract_text_from_file(local_path)
                        combined_text += f"\n\n{extracted}"
                        # Cleanup
                        if os.path.exists(local_path): os.remove(local_path)
                    except Exception as e:
                        print(f"[QuizPipeline] Failed to process file {file_path}: {e}")
                
                # 3. Use Text Content (if no file path or fallback)
                else:
                    content = note.get('content')
                    if content:
                        combined_text += f"\n\n{content}"
                        
            except Exception as e:
                print(f"[QuizPipeline] Error processing note {note_id}: {e}")

        if not combined_text.strip():
            print("[QuizPipeline] Combined text empty.")
            return {"error": "Selected notes are empty or unreadable."}, 400
            
        # 1. Extract Facts (Strict Grounding)
        facts = fact_extractor.extract_facts(combined_text, limit=num_questions * 3)
        print(f"[QuizPipeline] Extracted {len(facts)} from text length {len(combined_text)}")
        
        if not facts:
            return {"error": "Could not extract valid facts from notes (Too short/weak)."}, 400
            
        questions = []
        
        # 2. Round 1: Standard MCQ
        for fact in facts:
            if len(questions) >= num_questions: break
            print(f"[QuizPipeline] Generating MCQ for: {fact[:30]}...")
            q = self.generate_llm_question(fact, q_type="mcq")
            if q: 
                q['id'] = len(questions)
                questions.append(q)
        
        # 3. Round 2: True/False (Expansion)
        if len(questions) < num_questions:
            print(f"[QuizPipeline] Expanding with True/False (Current: {len(questions)}/{num_questions})")
            for fact in facts:
                if len(questions) >= num_questions: break
                # Skip if this fact was already used? ideally yes, but for expansion we re-use as different type
                q = self.generate_llm_question(fact, q_type="tf")
                if q:
                    q['id'] = len(questions)
                    questions.append(q)
                    
        # 4. Fallback (NLTK Regex)
        if len(questions) < num_questions:
             print(f"[QuizPipeline] Fallback to NLTK (Current: {len(questions)}/{num_questions})")
             for fact in facts:
                if len(questions) >= num_questions: break
                q = fact_extractor.generate_question_from_fact(fact, combined_text)
                if q:
                    q['id'] = len(questions)
                    questions.append(q)

        return {
            "questions": questions,
            "metadata": {
                "source": "notes", 
                "buckets_used": filenames,
                "confidence": "high",
                "note": "Generated via Hybrid LLM/Extractive Pipeline"
            }
        }, 200

    def run_quiz_from_dataset(self, topic, num_questions):
        print(f"[QuizPipeline] Dataset Mode: {topic}")
        data_text = self.quiz_gen.get_text_by_subject(topic)
        if not data_text:
             return {"error": f"No data found for topic {topic} in embedded dataset."}, 400
             
        facts = fact_extractor.extract_facts(data_text, limit=num_questions * 3)
        questions = []
        
        # Round 1: MCQ
        for fact in facts:
            if len(questions) >= num_questions: break
            q = self.generate_llm_question(fact, q_type="mcq")
            if q: 
                q['id'] = len(questions)
                questions.append(q)
                
        # Round 2: T/F
        if len(questions) < num_questions:
             for fact in facts:
                if len(questions) >= num_questions: break
                q = self.generate_llm_question(fact, q_type="tf")
                if q: 
                    q['id'] = len(questions)
                    questions.append(q)

        return {
            "questions": questions,
            "metadata": {
                "source": "dataset",
                "topic": topic,
                "confidence": "medium"
            }
        }, 200

quiz_pipeline = QuizPipeline()

# --- 3. Chat Pipelines (Strict) ---
# Instantiate globals
quiz_gen = QuizGenerator()
rag_system = RAGSystem() # Now uses LangChain
dl_summarizer = DLSummarizer()
nlp_tips = None

class RAGPipeline:
    def run_chat_rag(self, message, bucket_name, provider, provider_options):
        """Strict RAG pipeline. Using Notes ONLY."""
        print(f"[RAGPipeline] Query: {message}, Bucket: {bucket_name}")
        from llm_providers import get_provider
        try:
            llm = get_provider(provider, **provider_options)
        except Exception as e:
            return {"error": f"Provider Init Error: {e}"}, 500

        # RAG Search (Using LangChain)
        answer, sources = rag_system.query(message, subject_filter=bucket_name, llm_module=llm)
        
        # Explicit Failure Handling
        confidence = "high" if sources else "none"

        return {
            "content": answer,
            "sources": sources,
            "metadata": {
                "source": "notes",
                "buckets_used": [bucket_name] if bucket_name else ["all"],
                "confidence": confidence
            }
        }, 200

class AIPipeline:
    def run_chat_ai(self, message, provider, provider_options):
        """Strict AI-only chat pipeline. No RAG."""
        print(f"[AIPipeline] Query: {message}")
        from llm_providers import get_provider

        try:
            llm = get_provider(provider, **provider_options)

            # Use POSITIVE instructions to avoid negative priming
            prompt = (
                "<|system|>\n"
                "You are AI Study Pal, a helpful student companion.\n"
                "Respond to the user in a friendly, casual, and direct way.\n"
                "Do NOT explain your behavior. Do NOT be verbose.\n"
                "If the user says hello, just say 'Hey there! Ready to study?'.\n"
                "Keep answers very short (1-2 sentences) unless asked to explain a concept.\n"
                "</s>\n"
                "<|user|>\n"
                f"{message}</s>\n"
                "<|assistant|>\n"
            )

            # Request few tokens
            reply = llm.generate(prompt, max_tokens=60)

            # HARD TRIM
            reply = reply.strip()
            reply = reply.split("\n\n")[0]
            for token in ["User:", "<|user|>", "Assistant:", "<|assistant|>"]:
                if token in reply:
                    reply = reply.split(token)[0].strip()

            # Expanded Safety Net
            # Catches: "Sure, here is...", "Here's a script...", "Revised version..."
            BAD_STARTS = [
                "sure, here",
                "here is",
                "here's",
                "here are",
                "revised version",
                "chatbot script",
                "python script",
                "below is",
                "certainly",
            ]
            
            # Check lowercase start
            lower_reply = reply.lower()
            if any(lower_reply.startswith(b) for b in BAD_STARTS) or "revised version" in lower_reply:
                 reply = "Hey! 😊 How can I help you?"

            return {
                "content": reply,
                "metadata": {
                    "source": "ai",
                    "provider": provider,
                    "confidence": "low"
                }
            }, 200

        except Exception as e:
            return {"error": f"AI Generation Error: {e}"}, 500

rag_pipeline = RAGPipeline()
ai_pipeline = AIPipeline()

class NLPTipsGenerator:
     def get_tips(self, text):
         print(f"[Tips] Generating tips for text length {len(text)}...")
         from llm_providers import get_provider
         try:
            # Default to local for speed/cost, unless configured otherwise globally? 
            # Sticking to 'local' as requested by plan.
            llm = get_provider('local')
            
            # Simple Strict Prompt
            prompt = (
                "<|system|>\n"
                "You are an expert study coach. Provide 3-5 specific, high-impact study tips based strictly on the text provided.\n"
                "Focus on Active Recall questions and Application scenarios.\n"
                "Output as a clean list of sentences.\n"
                "</s>\n"
                "<|user|>\n"
                f"Study Material:\n{text[:4000]}\n\n" # Truncate to safety
                "Generate 3-5 actionable study tips.\n"
                "</s>\n"
                "<|assistant|>\n"
            )
            
            # Generate
            response = llm.generate(prompt, max_tokens=400)
            
            # Parse Response
            tips = []
            lines = response.split('\n')
            for line in lines:
                line = line.strip()
                if not line: continue
                
                # Strip bullets/numbers
                if line.startswith(('-', '*', '•')):
                    line = line[1:].strip()
                elif line[0].isdigit() and len(line) > 1 and line[1] in ('.', ')'):
                    line = line[2:].strip()
                    
                if len(line) > 10: # Filter short noise
                    tips.append(line)
                    
            if not tips:
                return ["Review the key concepts and try to explain them in your own words.", "Create flashcards for the definitions found in the text."]
                
            return tips[:5]

         except Exception as e:
             print(f"[Tips] Generation Error: {e}")
             return ["Could not generate specific tips. Try simplifying the text.", "Focus on active recall of the main topics."]
nlp_tips = NLPTipsGenerator()

class StudyPlanGenerator:
    def generate_plan(self, subject, hours, goal, grade="10", syllabus="General"):
        print(f"[StudyPlan] Generating plan for {subject} ({hours}h/day) - {goal}...")
        from llm_providers import get_provider
        try:
            llm = get_provider('local')
            
            # Strict JSON Prompt
            prompt = (
                "<|system|>\n"
                "You are an expert academic planner. Create a 7-day study schedule.\n"
                "Respond ONLY with valid JSON.\n"
                "Structure: { \"plan\": [ { \"day\": \"Day 1\", \"tasks\": [\"Task 1\", \"Task 2\"] } ] }\n"
                "</s>\n"
                "<|user|>\n"
                f"Subject: {subject}\n"
                f"Grade/Level: {grade} ({syllabus})\n"
                f"Goal: {goal}\n"
                f"Intensity: {hours} hours/day\n\n"
                "Generate a detailed weekly plan in strictly valid JSON.\n"
                "</s>\n"
                "<|assistant|>\n"
            )
            
            response = llm.generate(prompt, max_tokens=1200)
            
            # Clean Markdown
            clean_json = response.strip()
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
            import json
            try:
                data = json.loads(clean_json)
                return data # Expecting {"plan": [...]}
            except json.JSONDecodeError:
                print(f"[StudyPlan] JSON Fail: {clean_json[:100]}...")
                # Fallback: Manual Parsing if simple list
                return {
                    "plan": [
                        {"day": "Day 1", "tasks": ["Review Syllabus", "Read Chapter 1"]},
                        {"day": "Day 2", "tasks": ["Practice Problems", "Summary Notes"]},
                        {"day": "Day 3", "tasks": ["Quiz Topic A", "Review Errors"]},
                        {"day": "Day 4", "tasks": ["Read Chapter 2", "Concept Mapping"]},
                        {"day": "Day 5", "tasks": ["Practice Set B", "Flashcards"]},
                        {"day": "Day 6", "tasks": ["Full Mock Test", "Analyze Weak Areas"]},
                        {"day": "Day 7", "tasks": ["Rest & Light Review", "Plan Next Week"]}
                    ]
                }

        except Exception as e:
            print(f"[StudyPlan] Error: {e}")
            return {"error": str(e)}

study_plan_gen = StudyPlanGenerator()
