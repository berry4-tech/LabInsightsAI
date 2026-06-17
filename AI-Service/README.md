# AI-Service - Python Microservice for Lab Report Analysis

A Flask-based microservice that handles AI-powered lab report analysis and RAG-based chat functionality.

## Architecture

This microservice is part of a split architecture:

- **Node.js/Express (Port 5000)** - Handles CRUD operations (auth, profile, admin, uploads)
- **Python/Flask (Port 5001)** - Handles AI analysis and RAG chat (this service)

The Node.js server calls this Python microservice for AI tasks.

## Features

- 📄 **PDF Analysis** - Extract and analyze lab reports using LLM
- 🧠 **Embedding Generation** - Create vector embeddings for semantic search
- 💬 **RAG Chat** - Answer questions about lab reports using retrieved context

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/analyze` | Analyze PDF and create embeddings |
| GET | `/chat/latest-report` | Get user's latest report info |
| POST | `/chat/ask` | RAG-based chat |

### 1. POST `/analyze`

Analyze a PDF lab report and return AI-generated insights.

**Request:**
```json
{
  "file_path": "/path/to/uploaded/file.pdf"
}
```

**Response:**
```json
{
  "ai_summary": {
    "overall": "Summary text...",
    "keyFindings": ["finding 1", "finding 2"],
    "recommendations": ["rec 1", "rec 2"],
    "severity": "low"
  },
  "testResults": [
    {
      "name": "Hemoglobin",
      "value": "14.5",
      "unit": "g/dL",
      "normalRange": "13.5 - 17.5",
      "status": "normal",
      "interpretation": "..."
    }
  ],
  "embedding_path": "Embeddings/filename.pkl"
}
```

### 2. GET `/chat/latest-report?email=user@example.com`

Get user's latest report and suggested questions.

**Response:**
```json
{
  "report": {
    "file_name": "report.pdf",
    "uploaded_at": "2024-01-15T10:30:00"
  },
  "embedding_path": "Embeddings/report.pkl",
  "suggested_questions": [
    "Summarize my latest lab report in simple words.",
    "Is there anything urgent in my latest lab report?"
  ]
}
```

### 3. POST `/chat/ask`

Ask questions about your lab report using RAG.

**Request:**
```json
{
  "question": "What does my hemoglobin level mean?",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "answer": "Your hemoglobin level of 14.5 g/dL is within the normal range..."
}
```

## Setup Instructions

### Prerequisites

- Python 3.10 or higher
- MongoDB running on localhost:27017
- Groq API key

### Installation

1. **Navigate to the AI-Service directory:**
   ```bash
   cd AI-Service
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment variables:**
   ```bash
   # Copy example and edit with your values
   cp .env.example .env
   ```
   
   Edit `.env` and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   MONGO_URI=mongodb://localhost:27017/
   ```

6. **Run the service:**
   ```bash
   python ai_service.py
   ```

   The service will start on `http://localhost:5001`

## How Node.js Calls This Service

From your Node.js backend, use `axios` or `fetch` to call these endpoints:

### Example: Calling /analyze from Node.js

```javascript
const axios = require('axios');

const AI_SERVICE_URL = 'http://localhost:5001';

async function analyzeReport(filePath) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/analyze`, {
      file_path: filePath
    });
    return response.data;
  } catch (error) {
    console.error('AI Service error:', error.message);
    throw error;
  }
}

// Usage in your upload route:
app.post('/api/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;
  
  // Call AI service
  const aiResult = await analyzeReport(filePath);
  
  // Save to MongoDB
  await Report.create({
    user_email: req.body.email,
    file_name: req.file.originalname,
    file_path: filePath,
    ai_summary: aiResult.ai_summary,
    test_results: aiResult.testResults,
    embedding_path: aiResult.embedding_path,
    uploaded_at: new Date()
  });
  
  res.json({ success: true, ...aiResult });
});
```

### Example: Calling /chat/ask from Node.js

```javascript
async function askQuestion(question, email) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chat/ask`, {
      question,
      email
    });
    return response.data;
  } catch (error) {
    console.error('AI Service error:', error.message);
    throw error;
  }
}
```

### Example: Calling /chat/latest-report from Node.js

```javascript
async function getLatestReport(email) {
  try {
    const response = await axios.get(
      `${AI_SERVICE_URL}/chat/latest-report?email=${encodeURIComponent(email)}`
    );
    return response.data;
  } catch (error) {
    console.error('AI Service error:', error.message);
    throw error;
  }
}
```

## Project Structure

```
AI-Service/
├── ai_service.py        # Main Flask app with all endpoints
├── Embeddings/          # Folder for .pkl embedding files (auto-created)
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment template
└── README.md            # This file
```

## Technologies Used

- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **PyMongo** - MongoDB driver
- **Sentence-Transformers** - Embedding generation
- **LangChain** - PDF processing and text splitting
- **Groq** - LLM API (Llama 3.3 70B)
- **NumPy** - Numerical computing

## Troubleshooting

### Model Download on First Run

The first time you run the service, it will download the SentenceTransformer model (~90MB). This may take a few minutes.

### CUDA/GPU Support

If you have a CUDA-compatible GPU, PyTorch will automatically use it. For CPU-only systems, the service will work but may be slower.

### MongoDB Connection

Ensure MongoDB is running:
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

### Port Conflicts

If port 5001 is in use, modify the port in `ai_service.py`:
```python
app.run(host="0.0.0.0", port=5002, debug=True)  # Change to different port
```
