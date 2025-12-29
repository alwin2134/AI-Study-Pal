import os
from dotenv import load_dotenv

# Load environment variables from root .env
# app.py is in backend/, so .env is in ../.env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import pandas as pd

import data_manager
import file_processor # Added
import metadata_manager # Added
from werkzeug.utils import secure_filename # Added
import background
import supabase_client as supabase

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'data', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend is running!"})



@app.route('/api/input', methods=['POST'])
def save_input():
    data = request.json
    subject = data.get('subject')
    hours = data.get('hours')
    text = data.get('text')
    
    if not all([subject, hours, text]):
        return jsonify({"error": "Missing fields"}), 400
        
    data_manager.store_user_input(subject, hours, text)
    return jsonify({"message": "Input stored successfully"})

# Central Intent Router
def route_request(feature, payload):
    """
    Central router that enforces Strict Mode-Source Contracts.
    Returns: (response_data, status_code)
    """
    try:
        if feature == 'chat':
            use_notes = payload.get('useNotes', False)
            provider = payload.get('provider', 'local')
            bucket_name = payload.get('bucketName')
            message = payload.get('message')
            
            # [STRICT] Chat + Use Notes -> RAG Pipeline ONLY
            if use_notes:
                if not bucket_name:
                    # Optional: if UI sends empty bucket for "All Notes", handle it. 
                    # But strict mode might demand explicit selection. Let's allow "All Notes" = None/Empty.
                    pass
                
                # Check providers
                allowed_providers = ['local', 'gemini', 'openai']
                if provider not in allowed_providers:
                     return {"error": f"Invalid provider {provider}"}, 400

                from ml_utils import rag_pipeline
                return rag_pipeline.run_chat_rag(message, bucket_name, provider, payload.get('provider_options', {}))

            # [STRICT] Chat + AI Only -> AI Pipeline ONLY
            else:
                from ml_utils import ai_pipeline
                return ai_pipeline.run_chat_ai(message, provider, payload.get('provider_options', {}))

        elif feature == 'quiz':
            # Identify source based on payload keys
            # Quiz Prep UI sends:
            # - Notes Mode: { filenames: [...], numQuestions, ... }
            # - Subject Mode: { topic: "Biology", numQuestions, ... }
            
            filenames = payload.get('filenames')
            topic = payload.get('topic')
            num_questions = int(payload.get('numQuestions', 5))
            
            # [STRICT] Quiz + Notes -> Notes Pipeline ONLY
            if filenames and len(filenames) > 0:
                from ml_utils import quiz_pipeline
                return quiz_pipeline.run_quiz_from_notes(filenames, num_questions)
            
            # [STRICT] Quiz + AI/Dataset -> Dataset Pipeline ONLY
            elif topic:
                # Disallow "My Notes" string magic. Using filenames presence as sole source for notes.
                if topic in ['My Notes', 'user_notes']:
                     return {"error": "Invalid request: 'My Notes' selected but no files provided."}, 400
                
                from ml_utils import quiz_pipeline
                return quiz_pipeline.run_quiz_from_dataset(topic, num_questions)
            
            else:
                return {"error": "Invalid Quiz Request: No Source (filenames or topic) provided."}, 400

        else:
            return {"error": "Unknown feature"}, 400

    except Exception as e:
        print(f"Router Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    response, status = route_request('chat', data)
    return jsonify(response), status

@app.route('/api/quiz', methods=['POST'])
def quiz():
    data = request.json
    response, status = route_request('quiz', data)
    return jsonify(response), status

@app.route('/api/notes', methods=['POST'])
def add_note():
    data = request.json
    title = data.get('title')
    content = data.get('content')
    bucket = data.get('bucket')
    
    if not all([title, content, bucket]):
        return jsonify({"error": "Missing fields"}), 400

    # 1. Save to Disk as .txt
    # Sanitize title for filename
    safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')]).strip()
    filename = f"note_{safe_title}.txt"
    
    # Save file
    try:
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        # Update Metadata
        metadata_manager.add_file_metadata(filename, original_name=title, bucket_name=bucket)
        
    except Exception as e:
        print(f"Error saving note to disk: {e}")
        return jsonify({"error": f"Failed to save note: {e}"}), 500

    # 2. Add to RAG System
    from ml_utils import rag_system
    try:
        # We use 'original_filename' as a way to track source in RAG
        count = rag_system.add_document(content, subject=bucket, original_filename=title)
        return jsonify({"message": "Note saved and indexed successfully", "chunks": count}), 200
    except Exception as e:
        print(f"Indexing failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/files', methods=['GET'])
def list_files():
    bucket_name = request.args.get('bucket')
    
    try:
        # 1. Get Buckets to resolve Name -> ID
        buckets = supabase.fetch_note_buckets()
        bucket_map = {b['name']: b['id'] for b in buckets}
        bucket_id_to_name = {b['id']: b['name'] for b in buckets}
        
        target_bucket_id = None
        if bucket_name:
            target_bucket_id = bucket_map.get(bucket_name)
            if not target_bucket_id and bucket_name != "Uncategorized":
                return jsonify({})
        
        # 2. Fetch Notes from Supabase
        notes = supabase.fetch_notes(target_bucket_id)
        
        # 3. Format for Frontend
        response_data = {}
        for n in notes:
             # Use ID as the robust system key
             key = str(n['id'])
             
             # Resolve bucket name from ID
             note_bucket_id = n.get('bucket_id')
             resolved_bucket_name = bucket_id_to_name.get(note_bucket_id, "Uncategorized")
             
             response_data[key] = {
                 "original_name": n['title'],
                 "bucket_name": resolved_bucket_name,
                 "id": n['id']
             }
             
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error listing files from Supabase: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/summarize', methods=['POST'])
def summarize_text():
    data = request.json
    text = data.get('text', '')
    filenames = data.get('filenames', [])
    bucket_name = data.get('bucketName')
    
    # If filenames are provided, fetch their content
    # If filenames are provided, fetch their content
    if filenames and bucket_name:
        import os
        combined_text = ""
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        upload_dir = os.path.join(BASE_DIR, 'data', 'uploads')
        
        for fname in filenames:
            # fname is now the Note ID (from list_files) 
            # or potentially a filename if legacy checks apply.
            
            # 1. Try Fetching Content from DB (Most Robust)
            # 1. Try Fetching Content from DB (Most Robust)
            try:
                print(f"[Summarizer] Fetching content for ID/Key: {fname}")
                from supabase_client import get_note_content_by_id
                db_content = get_note_content_by_id(fname)
                
                if db_content:
                    combined_text += f"\n\n--- DOCUMENT BREAK ---\n\n{db_content}"
                    continue # Success, move to next file
            except Exception as e:
                print(f"[Summarizer] DB Fetch failed: {e}")

            # 2. Fallback: Check Local/Storage if DB fetch returned None
            
            sanitized_name = os.path.basename(fname)
            fpath = os.path.join(upload_dir, sanitized_name)
            
            if os.path.exists(fpath):
                 try:
                     from file_processor import extract_text_from_file
                     file_text = extract_text_from_file(fpath)
                     combined_text += f"\n\n--- DOCUMENT BREAK ---\n\n{file_text}"
                 except Exception as e:
                     print(f"Error reading local file {fname}: {e}")
        
        if combined_text:
            if text:
                text += "\n\n" + combined_text
            else:
                text = combined_text
    
    # Check if we have text after trying to load files
    if not text:
        if filenames:
            return jsonify({"error": "Could not read content from selected files. They might be empty or missing."}), 400
        return jsonify({"error": "No text provided"}), 400
        
    # --- LLM Summarization Pipeline ---
    
    # --- LLM Summarization Pipeline ---
    
    # 1. Hard Backend Assertion
    print(f"[Summarizer] Extracted text length: {len(text)}")
    input_length = len(text.strip())
    if input_length < 300:
        return jsonify({
            "error": f"Document content too short to summarize ({input_length} chars). Minimum 300 required."
        }), 400

    try:
        from llm_providers import get_provider
        # Default to local for summarizer unless specified
        llm = get_provider('local') 
        
        # 2. Strict JSON Prompt Structure
        prompt = (
            "<|system|>\n"
            "You are an expert academic summarizer.\n"
            "You must respond with valid JSON only.\n"
            "Do NOT include any preamble, system text, or markdown formatting (like ```json).\n"
            "</s>\n"
            "<|user|>\n"
            "Summarize the content below.\n"
            "Respond ONLY with this JSON structure:\n"
            "{\n"
            '  "key_themes": ["theme1", "theme2", "theme3"],\n'
            '  "detailed_summary": "paragraph text...",\n'
            '  "ai_insight": "one sentence insight..."\n'
            "}\n"
            "\n"
            f"CONTENT:\n{text[:12000]}\n"
            "</s>\n"
            "<|assistant|>\n"
            "{\n"
            '  "key_themes": [\n'
        )
        
        print(f"[Summarizer] Sending JSON prompt to LLM...")
        raw_response = llm.generate(prompt, max_tokens=800)
        
        # 3. Parse JSON Response
        # Prepend the forced start
        full_json_str = '{\n  "key_themes": [\n' + raw_response.strip()
        
        # Cleanup: Remove any markdown fences if the model ignored instructions
        if "```json" in full_json_str:
            full_json_str = full_json_str.replace("```json", "").replace("```", "")
        
        import json
        try:
            # Try parsing
            parsed = json.loads(full_json_str)
            summary = parsed.get("detailed_summary", "No summary provided.")
            key_themes = parsed.get("key_themes", [])
            feedback = parsed.get("ai_insight", "")
        except json.JSONDecodeError:
            print(f"[Summarizer] JSON Decode Failed. Raw: {full_json_str[:100]}...")
            # Fallback: simple text extraction if JSON fails
            summary = full_json_str
            key_themes = ["Error parsing JSON"]
            feedback = "Raw output returned."
            
            # Attempt to salvage via substring search
            if '"detailed_summary":' in full_json_str:
                import re
                sum_match = re.search(r'"detailed_summary":\s*"(.*?)"', full_json_str, re.DOTALL)
                if sum_match: summary = sum_match.group(1)

        return jsonify({
            "summary": summary,
            "key_themes": key_themes,
            "feedback": feedback
        })
        
    except Exception as e:
        print(f"Summarization error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/tips', methods=['POST'])
def get_tips():
    data = request.json
    text = data.get('text', '')
    
    from ml_utils import nlp_tips
    tips = nlp_tips.get_tips(text)
    
    return jsonify({"tips": tips})

@app.route('/api/schedule', methods=['POST'])
def generate_schedule():
    data = request.json
    subject = data.get('subject', 'General')
    hours = int(data.get('hours', 2))
    
    # Simple logic to generate a schedule CSV
    schedule_data = []
    for i in range(hours):
        schedule_data.append({
            "Hour": i + 1,
            "Activity": f"Study {subject} - Session {i+1}",
            "Type": "Review" if i % 2 == 0 else "Practice"
        })
    
    df = pd.DataFrame(schedule_data)
    import io
    csv_io = io.StringIO()
    df.to_csv(csv_io, index=False)
    
    return jsonify({
        "csv_content": csv_io.getvalue(),
        "filename": "study_schedule.csv"
    })



@app.route('/api/ask-notes', methods=['POST'])
def ask_notes():
    data = request.json
    question = data.get('question', '')
    subject = data.get('subject', 'All Notes')
    provider = data.get('provider', 'local')
    provider_opts = data.get('provider_options', {}) or {}
    from ml_utils import rag_system
    from llm_providers import get_provider
    llm = get_provider(provider, **provider_opts)
    answer, sources = rag_system.query(question, subject_filter=subject, llm_module=llm)
    
    return jsonify({
        "answer": answer,
        "sources": sources
    })


@app.route('/api/evidence', methods=['POST'])
def get_evidence():
    data = request.json
    question = data.get('question', '')
    subject = data.get('subject', None)
    top_k = int(data.get('top_k', 5))

    from ml_utils import rag_system
    candidates = rag_system.retrieve(question, subject_filter=subject, top_k=top_k)

    # Return candidates with offsets and short excerpt
    out = []
    for c in candidates:
        meta = c.get('meta', {}) if c.get('meta') else {}
        out.append({
            'text': c.get('text'),
            'source': c.get('source'),
            'score': c.get('score'),
            'start': meta.get('start'),
            'end': meta.get('end')
        })

    return jsonify({'evidence': out})


@app.route('/api/tasks', methods=['GET'])
def list_background_tasks():
    try:
        tasks = background.list_tasks()
        return jsonify(tasks)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_background_task(task_id):
    try:
        status = background.get_task_status(task_id)
        return jsonify(status)
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    bucket_name = request.form.get('bucketName', 'Uncategorized')
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        bucket_name = request.form.get('bucketName', 'Uncategorized')
        
        # Use absolute path for temporary processing
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        temp_dir = os.path.join(BASE_DIR, 'data', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        temp_filepath = os.path.join(temp_dir, filename)
        
        try:
            # 1. Save locally temporarily for processing
            file.save(temp_filepath)
            
            # 2. Extract Text
            text_content = file_processor.extract_text_from_file(temp_filepath)
            
            # 3. Upload to Supabase Storage - REMOVED (Frontend handles this)
            # We strictly use this endpoint for RAG Indexing now.
            
            # 3.5 Check if text was extracted
            if not text_content:
                return jsonify({"error": "Could not extract text from file"}), 400

            # 4. Add to RAG System (Background)
            from ml_utils import rag_system
            task_id = background.submit_task(rag_system.add_document, text_content, bucket_name, file.filename)
            print(f"Scheduled background indexing for {filename} (task {task_id})")
            
            # 5. Cleanup Temp File
            os.remove(temp_filepath)
            
            return jsonify({
                "message": "File uploaded and indexed successfully",
                "filename": filename,
                "content_preview": text_content[:200] + "...",
                "indexing_task_id": task_id
            })
            
        except Exception as e:
            print(f"Upload flow failed: {e}")
            if os.path.exists(temp_filepath):
                os.remove(temp_filepath)
            return jsonify({"error": str(e)}), 500

            return jsonify({"error": str(e)}), 500

@app.route('/api/reprocess', methods=['POST'])
def reprocess_document():
    # Triggered by Frontend 'Reprocess' button
    # Downloads existing file from Supabase, Extracts Text, Updates 'notes' table, and Re-indexes in RAG.
    data = request.json
    file_path = data.get('filePath') # path in bucket
    note_id = data.get('noteId')
    
    if not file_path or not note_id:
        return jsonify({"error": "Missing filePath or noteId"}), 400
        
    print(f"[Reprocess] Request for: {file_path}")
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    temp_dir = os.path.join(BASE_DIR, 'data', 'temp_reprocess')
    os.makedirs(temp_dir, exist_ok=True)
    
    local_filename = os.path.basename(file_path)
    if not local_filename: local_filename = f"temp_{note_id}"
    local_path = os.path.join(temp_dir, local_filename)

    try:
        # 1. Download from Supabase 'uploads' bucket
        # Note: filePath from frontend might include folders e.g. "user_id/bucket_id/filename"
        # The download_file function expects the 'name' (path) relative to bucket root.
        
        # We assume bucket is 'uploads' as enforced everywhere else.
        from supabase_client import download_file
        download_file(file_path, dest_path=local_path, bucket='uploads')
        
        # 2. Extract Text
        text_content = file_processor.extract_text_from_file(local_path)
        
        if not text_content:
             return jsonify({"error": "Failed to extract text"}), 500
             
        # 3. Update Supabase 'notes' table
        from supabase_client import update_note_content
        update_note_content(note_id, text_content)
        
        # 4. Re-index in RAG
        from ml_utils import rag_system
        rag_system.add_document(text_content, subject='Reprocessed', original_filename=local_filename)
        
        # Cleanup
        if os.path.exists(local_path): os.remove(local_path)
        
        return jsonify({"message": "Document reprocessed and indexed successfully", "preview": text_content[:100]})
        
    except Exception as e:
        print(f"[Reprocess] Error: {e}")
        if os.path.exists(local_path): os.remove(local_path)
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-plan', methods=['POST'])
def generate_study_plan_endpoint():
    try:
        data = request.json
        subject = data.get('subject')
        hours = data.get('hoursPerDay')
        goal = data.get('scenario')
        grade = data.get('grade', '10')
        syllabus = data.get('syllabus', 'General')
        
        from ml_utils import study_plan_gen
        result = study_plan_gen.generate_plan(subject, hours, goal, grade, syllabus)
        
        if "error" in result:
             return jsonify(result), 500
             
        return jsonify(result)
        
    except Exception as e:
        print(f"Generate Plan Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        # Access dataset
        df = data_manager.load_data()
        if df is None or df.empty:
            return jsonify({"error": "No dataset loaded"}), 404

        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import io
        import base64

        # Top 10 Subjects
        subject_counts = df['subject'].value_counts().head(10)
        
        plt.figure(figsize=(10, 6))
        # Dark theme style to match app
        plt.style.use('dark_background')
        
        bars = plt.bar(subject_counts.index, subject_counts.values, color='#0ea5e9')
        plt.xlabel('Subjects', color='white')
        plt.ylabel('Number of Questions/Facts', color='white')
        plt.title('Available Knowledge Base Distribution', color='white')
        plt.xticks(rotation=45, ha='right', color='gray')
        plt.yticks(color='gray')
        plt.grid(axis='y', linestyle='--', alpha=0.3)
        plt.tight_layout()

        # Save to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png', transparent=True)
        buf.seek(0)
        plt.close()

        # Encode
        data = base64.b64encode(buf.getvalue()).decode('utf-8')
        return jsonify({"chart_image": f"data:image/png;base64,{data}"})

    except Exception as e:
        print(f"Stats Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # [NEW] Rehydrate RAG System from Supabase Storage on Startup
    try:
        print("--- Rehydrating RAG Index from Supabase ---")
        from ml_utils import rag_system
        import shutil
        
        # 1. Fetch Metadata (Buckets & Notes)
        try:
            buckets = supabase.fetch_note_buckets()
            bucket_id_to_name = {b['id']: b['name'] for b in buckets}
            
            notes = supabase.fetch_notes() # Fetches all notes
            
            if not notes:
                print("No notes found in Supabase DB.")
            else:
                queued = 0
                BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                temp_rehydrate_dir = os.path.join(BASE_DIR, 'data', 'temp_rehydrate')
                os.makedirs(temp_rehydrate_dir, exist_ok=True)
                
                for n in notes:
                    note_id = n['id']
                    title = n['title']
                    bucket_id = n.get('bucket_id')
                    resolved_bucket_name = bucket_id_to_name.get(bucket_id, "Uncategorized")
                    
                    # Content Source: prefer DB content if available (faster)
                    content = n.get('content')
                    
                    # If content missing in DB, try storage (legacy) - but fetch_notes select includes content
                    if not content:
                         print(f"Skipping {title} (no content in DB)")
                         continue
                         
                    print(f"DTO processing: {title} -> {resolved_bucket_name}")
                    
                    # Re-index
                    # subject arg in add_document is the 'bucket' metadata used for filtering
                    rag_system.add_document(content, subject=resolved_bucket_name, original_filename=title)
                    queued += 1
                
                print(f"--- RAG Rehydration queued {queued} documents from Supabase. ---")

        except Exception as e:
            print(f"Supabase List/Rehydrate failed: {e}")

    except Exception as e:
        print(f"RAG Rehydration failed: {e}")

    # Run without the reloader to avoid double-starting heavy background work
    # and local LLM initialization. Use a production WSGI server for production.
    try:
        app.run(debug=False, port=5000, use_reloader=False)
    except Exception as e:
        with open("app_crash.log", "w") as f:
            import traceback
            traceback.print_exc(file=f)
        print(f"CRASH: {e}")


