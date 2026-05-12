# AI CloudOps Copilot - Installation & Command Reference

## Complete Command Guide (Copy & Paste)

### Phase 1: Initial Setup (Do Once)

#### 1.1 Backend Dependencies

```bash
pip install langchain langchain-core langchain-community langchain-groq langgraph faiss-cpu sentence-transformers torch huggingface-hub numpy python-dotenv fastapi uvicorn
```

Or use requirements file:

```bash
pip install -r requirements.txt
```

#### 1.2 Frontend Dependencies

```bash
cd frontend
npm install
```

#### 1.3 Environment Configuration

```bash
# Backend
cp .env.example .env
# Edit .env and add GROQ_API_KEY

# Frontend (already created)
# .env.local is already in frontend/ with NEXT_PUBLIC_LAMBDA_URL=http://localhost:8000
```

#### 1.4 Build Vector Store (One-time)

```bash
python scripts/build_vectorstore.py
```

### Phase 2: Running Locally (Do Every Session)

#### Terminal 1: Start Backend Server

```bash
cd backend
uvicorn local_server:app --port 8000 --reload
```

Expected output:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Expected output:

```
> next dev
ready - started server on 0.0.0.0:3000
```

#### Terminal 3: (Optional) Run Tests

```bash
# Test Lambda handler
cd backend
python test_lambda.py

# Test API server (while it's running)
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Why is my EC2 slow?"}'
```

### Phase 3: Access the Application

Open in browser:

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Individual Component Commands

### Backend Agent Testing

```bash
cd backend

# Test the agent directly
python agent.py

# Test Lambda handler
python test_lambda.py

# Start local API server
uvicorn local_server:app --port 8000 --reload

# Rebuild vector store if needed
cd ..
python scripts/build_vectorstore.py
```

### Frontend Development

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Lint code
npm run lint
```

### Vector Store Management

```bash
# Build initial vectorstore
python scripts/build_vectorstore.py

# The FAISS index is stored at:
# backend/vectorstore/faiss_index/
```

---

## Environment Variables

### Backend (.env)

```env
GROQ_API_KEY=gsk_your_actual_key_here
```

Get key from: https://console.groq.com/keys

### Frontend (frontend/.env.local)

```env
# Local development
NEXT_PUBLIC_LAMBDA_URL=http://localhost:8000

# Production (when deployed)
# NEXT_PUBLIC_LAMBDA_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

---

## Quick Troubleshooting

### Issue: "GROQ_API_KEY not found"

```bash
# Solution:
cp .env.example .env
# Edit .env and add your key
```

### Issue: "Vectorstore not found"

```bash
# Solution:
python scripts/build_vectorstore.py
```

### Issue: "Connection refused" on port 8000

```bash
# Solution: Make sure backend server is running
cd backend
uvicorn local_server:app --port 8000 --reload
```

### Issue: Port 3000 already in use

```bash
# Solution: Run on different port
cd frontend
npm run dev -- -p 3001
```

### Issue: Port 8000 already in use

```bash
# Solution: Run on different port
cd backend
uvicorn local_server:app --port 9000 --reload
# Update frontend .env.local: NEXT_PUBLIC_LAMBDA_URL=http://localhost:9000
```

---

## File Structure Quick Reference

```
ai-cloudops-copilot/
├── frontend/                      # Next.js app (port 3000)
│   ├── app/
│   │   ├── page.tsx              # Home (query input)
│   │   ├── results/page.tsx      # Results dashboard
│   │   ├── api/query/route.ts    # API route to backend
│   │   └── globals.css           # Tailwind styles
│   ├── package.json
│   ├── .env.local               # Frontend config (preconfigured)
│   └── ...config files (next.config.js, tsconfig.json, etc.)
│
├── backend/                       # Python backend (port 8000)
│   ├── agent.py                 # LangGraph agent (3 tools)
│   ├── rag.py                   # FAISS vectorstore
│   ├── lambda_handler.py        # Lambda entry point
│   ├── local_server.py          # FastAPI server (for testing)
│   ├── test_lambda.py           # Test suite
│   ├── mock_data/
│   │   ├── incidents/           # 10 AWS incident reports
│   │   └── metrics/             # Mock metrics JSON
│   └── vectorstore/             # FAISS index (generated)
│
├── scripts/
│   └── build_vectorstore.py     # Build vector index
│
├── .env.example                 # Backend template
├── .env                         # Backend config (add GROQ_API_KEY)
├── requirements.txt             # Python dependencies
└── README.md                    # Full documentation
```

---

## Tech Stack Summary

| Component         | Tech                           | Port |
| ----------------- | ------------------------------ | ---- |
| Frontend          | Next.js 14 + React 18          | 3000 |
| Styling           | Tailwind CSS                   | -    |
| Backend Server    | FastAPI                        | 8000 |
| LLM Orchestration | LangGraph + LangChain          | -    |
| LLM Provider      | Groq (gemma2-9b-it)            | -    |
| Vector Store      | FAISS                          | -    |
| Embeddings        | HuggingFace (all-MiniLM-L6-v2) | -    |
| Data              | Mock JSON + Incident Reports   | -    |

---

## API Reference

### POST /query

Forward a query to the DevOps agent.

**Request:**

```json
{
  "query": "Why is my EC2 running at 98% CPU?"
}
```

**Response:**

```json
{
  "summary": "Root cause analysis...",
  "logs_used": ["log entry 1", "log entry 2"],
  "similar_incidents": ["incident_1", "incident_2"],
  "recommended_fix": ["Step 1", "Step 2"]
}
```

### GET /health

Check if server is running.

**Response:**

```json
{
  "status": "healthy",
  "service": "AI CloudOps Copilot - Local Server",
  "version": "0.1.0"
}
```

### GET /docs

Interactive Swagger API documentation (FastAPI/Uvicorn only).

---

## Performance Notes

- **First run**: ~30-60 seconds (LLM cold start, FAISS loading)
- **Subsequent runs**: ~5-15 seconds (models cached)
- **Agent execution**: ~3-10 seconds (Groq API response time)

---

## Next Steps

1. ✅ Run `python scripts/build_vectorstore.py` once
2. ✅ Start backend: `uvicorn local_server:app --port 8000`
3. ✅ Start frontend: `cd frontend && npm run dev`
4. ✅ Open http://localhost:3000
5. ✅ Type a query and click "Analyze Issue"

Happy DevOps troubleshooting! 🚀
