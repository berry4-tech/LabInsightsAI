"""
AI-Service: Python Flask Microservice for Lab Report Analysis & RAG Chat
=========================================================================
This microservice handles:
- PDF analysis with AI-powered insights
- Embedding generation for RAG
- Chat functionality using retrieved context

Runs on port 5001 (Node.js backend runs on 5000)
"""

import os
import json
import pickle
import re
import time
from threading import Lock

import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv

from groq import Groq
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

app = Flask(__name__)

# CORS: Allow all origins during development
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"])

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["LabInsight"]
reports_col = db["reports"]

# Groq Client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("⚠️  WARNING: GROQ_API_KEY not found in .env file")
groq_client = Groq(api_key=GROQ_API_KEY)

# Embedding Model (loaded once at startup)
print("🔄 Loading SentenceTransformer model...")
embedding_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
print("✅ Model loaded successfully!")

# Embeddings Directory
EMBED_DIR = "Embeddings"
os.makedirs(EMBED_DIR, exist_ok=True)

# Rate limiting for Groq API
last_groq_call = 0
groq_lock = Lock()
MIN_GROQ_INTERVAL = 3  # Minimum seconds between Groq calls


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def analyze_report(pdf_path: str):
    """
    Analyze a PDF lab report:
    1. Extract text from PDF
    2. Create embeddings & save to .pkl file
    3. Use Groq LLM to generate structured analysis
    
    Returns: (ai_summary, test_results, embedding_path)
    """
    
    # ------- 1. LOAD PDF TEXT -------
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    chunks = splitter.split_documents(documents)

    texts = [c.page_content for c in chunks]
    full_text = "\n\n".join(texts)

    # ------- 2. BUILD & SAVE EMBEDDINGS -------
    vectors = embedding_model.encode(texts, convert_to_numpy=True)

    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    embedding_path = os.path.join(EMBED_DIR, f"{base_name}.pkl")

    with open(embedding_path, "wb") as f:
        pickle.dump({"texts": texts, "vectors": vectors}, f)

    # ------- 3. ASK GROQ FOR STRUCTURED JSON -------
    # FIX: Explicitly specify required tests
    prompt = f"""
You are a medical lab report analysis AI.

From this lab report text, extract a JSON object with this **exact** structure:

{{
  "summary": "Short overall overview in 2–3 sentences",
  "key_findings": ["finding 1", "finding 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "severity": "low" | "medium" | "high",
  "tests": [
    {{
      "name": "Test name",
      "value": "numeric or text value",
      "unit": "unit string",
      "normalRange": "e.g. 4.0 - 11.0",
      "status": "low" | "normal" | "high",
      "interpretation": "1–2 sentence explanation for this test"
    }}
  ]
}}

**IMPORTANT - You MUST extract ALL of these tests if they appear in the report:**
1. Vitamin D (ng/mL or nmol/L)
2. Hemoglobin (g/dL)
3. White Blood Cells / WBC Count (x10³/µL or /µL)
4. Total Cholesterol (mg/dL)
5. Fasting Glucose (mg/dL)
6. TSH (µIU/mL or mIU/L)

If any of these tests are present in the report, they MUST be included in the "tests" array.
Also include any other significant tests found in the report.

Rules:
- Return **ONLY valid JSON**. 
- No backticks, no Markdown, no extra text before or after the JSON.
- Extract numeric values without commas (e.g., "7900" not "7,900")

Lab Report Text:
\"\"\"{full_text}\"\"\"
"""

    # Rate limiting for Groq API
    global last_groq_call
    with groq_lock:
        elapsed = time.time() - last_groq_call
        if elapsed < MIN_GROQ_INTERVAL:
            wait_time = MIN_GROQ_INTERVAL - elapsed
            print(f"⏳ Rate limiting: waiting {wait_time:.1f}s before Groq call")
            time.sleep(wait_time)
        last_groq_call = time.time()

    # FIX: Set temperature=0 for deterministic output
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,  # <-- ADD THIS for consistent output
    )

    raw_content = response.choices[0].message.content.strip()

    # Strip markdown code blocks if present
    if raw_content.startswith("```"):
        raw_content = re.sub(r"^```[a-zA-Z]*\n", "", raw_content)
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3].strip()

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError:
        # Fallback: wrap raw text as summary
        parsed = {
            "summary": raw_content,
            "key_findings": [],
            "recommendations": [],
            "severity": "low",
            "tests": [],
        }

    # FIX: Validate required tests were extracted
    extracted_tests = parsed.get("tests", [])
    required_test_keywords = {
        "vitamin d": False,
        "hemoglobin": False,
        "white blood": False,
        "wbc": False,
        "cholesterol": False,
        "fasting glucose": False,
        "tsh": False
    }
    
    # Check which required tests were extracted
    for test in extracted_tests:
        test_name_lower = test.get("name", "").lower()
        for keyword in required_test_keywords:
            if keyword in test_name_lower:
                required_test_keywords[keyword] = True
    
    # Log any missing tests for debugging
    missing = [k for k, v in required_test_keywords.items() if not v]
    if missing:
        print(f"⚠️ Warning: These tests may be missing: {missing}")
        print(f"   Extracted tests: {[t.get('name') for t in extracted_tests]}")

    ai_summary = {
        "overall": parsed.get("summary", ""),
        "keyFindings": parsed.get("key_findings", []),
        "recommendations": parsed.get("recommendations", []),
        "severity": parsed.get("severity", "low"),
    }

    test_results = parsed.get("tests", [])

    return ai_summary, test_results, embedding_path

def get_latest_report_for_user(email: str):
    """
    Fetch the user's most recent report from MongoDB.
    Returns report info and suggested questions.
    """
    if not email:
        return {"error": "Email missing"}, 400

    report_cursor = reports_col.find({"user_email": email}).sort("uploaded_at", -1).limit(1)
    report_list = list(report_cursor)

    if not report_list:
        return {"report": None, "suggested_questions": []}

    report = report_list[0]

    return {
        "report": {
            "file_name": report.get("file_name", "Unknown"),
            "uploaded_at": str(report.get("uploaded_at", ""))
        },
        "embedding_path": report.get("embedding_path", ""),
        "suggested_questions": [
            "Summarize my latest lab report in simple words.",
            "Is there anything urgent in my latest lab report?",
            "Explain my latest hemoglobin result.",
            "Are my cholesterol and glucose values okay?",
            "What should I focus on improving based on my latest report?"
        ]
    }


def rag_chat(question: str, email: str):
    """
    RAG-based chat: retrieve relevant context from embeddings
    and generate an answer using Groq LLM.
    """
    print(f"💬 Chat request from {email}: {question[:50]}...")
    
    if not question or not email:
        return {"answer": "Error: question + email required"}

    # 1️⃣ GET LATEST REPORT FROM MONGO
    latest = reports_col.find_one(
        {"user_email": email},
        sort=[("uploaded_at", -1)]
    )

    if not latest:
        print(f"❌ No reports found for {email}")
        return {"answer": "No reports uploaded yet. Please upload a lab report first."}

    pkl_path = latest.get("embedding_path")
    print(f"📁 Embedding path from DB: {pkl_path}")

    if not pkl_path:
        return {"answer": "No embeddings found for this report."}

    # Handle both relative and absolute paths
    if not os.path.isabs(pkl_path):
        # Try relative to AI-Service directory
        script_dir = os.path.dirname(os.path.abspath(__file__))
        pkl_path = os.path.join(script_dir, pkl_path)
    
    print(f"📁 Looking for embedding at: {pkl_path}")

    if not os.path.exists(pkl_path):
        print(f"❌ Embedding file not found: {pkl_path}")
        return {"answer": "Embedding file missing on server. Please re-upload your report."}

    # 2️⃣ LOAD EMBEDDINGS
    try:
        with open(pkl_path, "rb") as f:
            emb = pickle.load(f)
        print("✅ Embeddings loaded successfully")
    except Exception as e:
        print(f"❌ Failed loading embeddings: {str(e)}")
        return {"answer": f"Failed loading embeddings: {str(e)}"}

    vectors = emb.get("vectors")
    texts = emb.get("texts")

    if vectors is None or texts is None:
        return {"answer": "Invalid embedding file format."}

    # 3️⃣ ENCODE QUESTION
    q_embed = embedding_model.encode(question)

    # 4️⃣ RANK CHUNKS BY SIMILARITY
    sims = np.dot(vectors, q_embed)
    top_idx = sims.argsort()[-3:][::-1]  # Top 3 most similar

    context = "\n\n".join([texts[i] for i in top_idx])

    # 5️⃣ CALL GROQ LLM with rate limiting
    prompt = f"""
Use ONLY the medical report info below to answer:

{context}

Question: {question}

Give a clear, simple explanation suitable for a patient.
"""

    try:
        # Rate limiting for Groq API
        global last_groq_call
        with groq_lock:
            elapsed = time.time() - last_groq_call
            if elapsed < MIN_GROQ_INTERVAL:
                wait_time = MIN_GROQ_INTERVAL - elapsed
                print(f"⏳ Rate limiting chat: waiting {wait_time:.1f}s before Groq call")
                time.sleep(wait_time)
            last_groq_call = time.time()

        print("🤖 Calling Groq API...")
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
        )

        answer = response.choices[0].message.content
        print("✅ Got response from Groq")
        return {"answer": answer}

    except Exception as e:
        print(f"❌ Groq API error: {str(e)}")
        return {"answer": f"Groq API error: {str(e)}"}


# ============================================================
# API ENDPOINTS
# ============================================================

@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "AI-Service",
        "version": "1.0.0",
        "endpoints": [
            "POST /analyze",
            "GET /chat/latest-report",
            "POST /chat/ask"
        ]
    })


@app.route("/analyze", methods=["POST"])
def analyze_endpoint():
    """
    POST /analyze
    
    Analyze a PDF lab report and return AI-generated insights.
    Accepts either:
    - multipart/form-data with 'file' field (for remote uploads)
    - JSON with 'file_path' field (for local development)
    
    Response:
        {
            "ai_summary": {...},
            "testResults": [...],
            "embedding_path": "Embeddings/filename.pkl"
        }
    """
    try:
        temp_file_path = None
        
        # Check if file was uploaded via form-data
        if 'file' in request.files:
            file = request.files['file']
            filename = request.form.get('filename', file.filename)
            
            # Save uploaded file temporarily
            temp_dir = "temp_uploads"
            os.makedirs(temp_dir, exist_ok=True)
            
            # Sanitize filename
            safe_filename = filename.replace(' ', '_').replace('/', '_')
            temp_file_path = os.path.join(temp_dir, safe_filename)
            file.save(temp_file_path)
            
            print(f"📄 Received uploaded file: {filename}")
            file_path = temp_file_path
        else:
            # Fallback to JSON body (for local development)
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "No file uploaded and no JSON data provided"}), 400
            
            file_path = data.get("file_path")
            
            if not file_path:
                return jsonify({"error": "file_path is required"}), 400
            
            if not os.path.exists(file_path):
                return jsonify({"error": f"File not found: {file_path}"}), 404
        
        print(f"📄 Analyzing: {file_path}")
        
        ai_summary, test_results, embedding_path = analyze_report(file_path)
        
        print(f"✅ Analysis complete. Embedding saved: {embedding_path}")
        
        # Clean up temp file if we created one
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                print(f"🗑️ Cleaned up temp file: {temp_file_path}")
            except:
                pass
        
        return jsonify({
            "ai_summary": ai_summary,
            "testResults": test_results,
            "embedding_path": embedding_path
        })
        
    except Exception as e:
        print(f"❌ Error in /analyze: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/chat/latest-report", methods=["GET"])
def latest_report_endpoint():
    """
    GET /chat/latest-report?email=user@example.com
    
    Get user's latest report info and suggested questions.
    
    Query Parameters:
        email: User's email address
    
    Response:
        {
            "report": {"file_name": "...", "uploaded_at": "..."},
            "embedding_path": "...",
            "suggested_questions": [...]
        }
    """
    try:
        email = request.args.get("email")
        
        if not email:
            return jsonify({"error": "Email query parameter is required"}), 400
        
        result = get_latest_report_for_user(email)
        
        # Check if result is an error tuple
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error in /chat/latest-report: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/chat/ask", methods=["POST"])
def chat_ask_endpoint():
    """
    POST /chat/ask
    
    RAG-based chat endpoint for asking questions about lab reports.
    
    Request Body:
        {"question": "...", "email": "user@example.com"}
    
    Response:
        {"answer": "..."}
    """
    print("\n" + "="*50)
    print("📩 Received POST /chat/ask")
    
    try:
        data = request.get_json()
        print(f"📦 Request data: {data}")
        
        if not data:
            print("❌ No JSON data provided")
            return jsonify({"error": "No JSON data provided"}), 400
        
        question = data.get("question")
        email = data.get("email")
        
        if not question:
            print("❌ Question is missing")
            return jsonify({"error": "question is required"}), 400
        
        if not email:
            print("❌ Email is missing")
            return jsonify({"error": "email is required"}), 400
        
        result = rag_chat(question, email)
        print(f"✅ Sending response: {str(result)[:100]}...")
        print("="*50 + "\n")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error in /chat/ask: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))  # Use PORT env var or default to 5001
    
    print("\n" + "=" * 60)
    print("🚀 AI-Service Starting...")
    print("=" * 60)
    print(f"📍 Port: {port}")
    print(f"📁 Embeddings Directory: {os.path.abspath(EMBED_DIR)}")
    print(f"🔗 MongoDB: {MONGO_URI}")
    print("=" * 60 + "\n")
    
    app.run(host="0.0.0.0", port=port, debug=False)  # debug=False for production
