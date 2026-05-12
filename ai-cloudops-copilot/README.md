# AI CloudOps Copilot - Full Stack Setup Guide

A voice-enabled DevOps assistant that analyzes AWS infrastructure issues using AI.

## 🏗️ Architecture Overview

```
┌─────────────────┐          ┌──────────────────┐          ┌──────────────┐
│  Next.js Frontend│──HTTP──▶│  FastAPI Server  │──Python─▶│ LangGraph    │
│  (React + Tailwind)       │  (local_server.py)           │ Agent + Tools│
└─────────────────┘          └──────────────────┘          └──────────────┘
                                     ▲                            │
                                     │                            ▼
                                     └────────Lambda (AWS)◀──FAISS Vectorstore
                                                              HuggingFace LLM
                                                              Groq API
```

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn
- Groq API key (get from https://console.groq.com/keys)

## 🚀 Quick Start (5 minutes)

### 1. Clone & Navigate

```bash
cd /Users/parthmishra/Documents/GitHub/Eventique/ai-cloudops-copilot
```

### 2. Set Up Python Backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env

# Edit .env and add your GROQ_API_KEY
# GROQ_API_KEY=gsk_your_actual_key_here
```

### 3. Build Vector Store

```bash
# This runs once to create the FAISS index
python scripts/build_vectorstore.py
```

### 4. Start Local Backend Server

```bash
# Terminal 1 - Run the local FastAPI server
cd backend
uvicorn local_server:app --port 8000 --reload

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### 5. Set Up & Run Frontend

```bash
# Terminal 2 - Install Node dependencies
cd frontend
npm install

# Run Next.js dev server
npm run dev

# You should see:
# ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 6. Open Browser

```
http://localhost:3000
```

## 📦 Installation Commands

### Backend Setup (All in one)

```bash
# Install all Python dependencies
pip install langchain langchain-core langchain-community langchain-groq langgraph faiss-cpu sentence-transformers torch huggingface-hub numpy python-dotenv fastapi uvicorn

# Or use requirements.txt
pip install -r requirements.txt
```

### Frontend Setup (All in one)

```bash
cd frontend
npm install

# Optional: Install additional dev tools
npm install --save-dev eslint prettier
```

## 🧪 Testing

### Test Backend Lambda Handler

```bash
cd backend
python test_lambda.py

# Expected output:
# [TEST 1] Normal query - EC2 CPU spike ✓
# [TEST 2] Missing query field ✓
# [TEST 3] Invalid JSON ✓
# [TEST 4] CORS preflight ✓
# [TEST 5] Different query type ✓
```

### Test Local API Server

```bash
# Make a test request
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Why is my EC2 slow?"}'

# Or check health
curl http://localhost:8000/health

# Open interactive API docs
# http://localhost:8000/docs
```

### Test Frontend

1. Navigate to http://localhost:3000
2. Type a query: "Why is my EC2 running at 98% CPU?"
3. Click "Analyze Issue"
4. Wait for results to appear on /results page

## 📁 Project Structure

```
ai-cloudops-copilot/
├── frontend/                          # Next.js React app
│   ├── app/
│   │   ├── page.tsx                  # Input page (home)
│   │   ├── results/page.tsx          # Results dashboard
│   │   ├── api/query/route.ts        # API endpoint to backend
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Tailwind styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── next.config.js
│   └── .env.local                    # Frontend config
│
├── backend/
│   ├── agent.py                      # LangGraph agent (3 tools)
│   ├── rag.py                        # FAISS vector store logic
│   ├── lambda_handler.py             # Lambda entry point
│   ├── local_server.py               # FastAPI local test server
│   ├── test_lambda.py                # Lambda tests
│   ├── mock_data/
│   │   ├── incidents/                # 10 AWS incident reports
│   │   └── metrics/                  # Mock CloudWatch metrics
│   └── vectorstore/                  # FAISS index (generated)
│
├── scripts/
│   └── build_vectorstore.py          # Build FAISS index once
│
├── .env.example                      # Template for credentials
├── .env                              # Your actual credentials (git ignored)
├── requirements.txt                  # Python dependencies
└── README.md                         # This file
```

## 🔧 Configuration

### Backend Configuration (.env)

```env
GROQ_API_KEY=gsk_your_actual_key_from_console_groq_com
```

### Frontend Configuration (frontend/.env.local)

```env
# For local development (FastAPI server)
NEXT_PUBLIC_LAMBDA_URL=http://localhost:8000

# For production (AWS Lambda + API Gateway)
# NEXT_PUBLIC_LAMBDA_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

## 🛠️ Development Commands

### Backend

```bash
# Run agent tests
python backend/agent.py

# Run Lambda tests
python backend/test_lambda.py

# Run local API server
cd backend
uvicorn local_server:app --port 8000 --reload

# Rebuild vector store
python scripts/build_vectorstore.py
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production build
npm run start

# Lint code
npm run lint
```

## 📊 Features

### Page 1: Query Input (/)

- ✅ Dark themed dashboard UI
- ✅ Text input for typing queries
- ✅ Mic button to record audio (demo mode)
- ✅ Submit button with loading state
- ✅ 3 feature cards showing capabilities

### Page 2: Results (/results)

- ✅ Issue Summary card (root cause analysis)
- ✅ Relevant Logs card (CloudWatch logs used)
- ✅ Similar Past Incidents card (FAISS search results)
- ✅ Recommended Fix card (numbered steps)
- ✅ Copy report to clipboard button
- ✅ Graceful "No data" handling

### Backend Agent (3 Tools)

1. **get_ec2_metrics()** → Mock EC2 CloudWatch data
2. **get_recent_logs()** → Simulated error logs
3. **search_incidents(query)** → FAISS semantic search

### LLM Chain

```
User Query
    ↓
LangGraph Agent (ReAct)
    ↓
    ├─ Tool 1: get_ec2_metrics()
    ├─ Tool 2: get_recent_logs()
    └─ Tool 3: search_incidents()
    ↓
Groq LLM (gemma2-9b-it)
    ↓
Structured Response JSON
```

## 🚨 Troubleshooting

### "GROQ_API_KEY not found"

```bash
# Make sure .env file exists in root directory
cp .env.example .env
# Edit .env and add your key from https://console.groq.com/keys
```

### "Vectorstore not found"

```bash
# Rebuild the vector store
python scripts/build_vectorstore.py
```

### "Connection refused" on port 8000

```bash
# Make sure local_server.py is running
cd backend
uvicorn local_server:app --port 8000 --reload
```

### Frontend can't reach backend

```bash
# Check NEXT_PUBLIC_LAMBDA_URL in frontend/.env.local
# Should be http://localhost:8000 for local development
```

### "Module not found" errors in backend

```bash
# Make sure you're in the correct directory
cd /Users/parthmishra/Documents/GitHub/Eventique/ai-cloudops-copilot

# Reinstall dependencies
pip install -r requirements.txt
```

## 📈 Next Steps (Phase 6+)

- [ ] AWS Transcribe integration (real voice-to-text)
- [ ] Deploy Lambda to AWS
- [ ] Set up API Gateway
- [ ] Add real AWS IAM authentication
- [ ] CloudWatch log streaming (not mocked)
- [ ] Real EC2/RDS metrics
- [ ] Database for storing analysis history
- [ ] Multi-user support with auth

## 🚀 Deployment (Future)

### Deploy Backend to AWS Lambda

```bash
# Package Python code
cd backend
zip -r lambda_package.zip agent.py rag.py lambda_handler.py
# Upload to AWS Lambda console

# Create API Gateway
# POST /query → Lambda function

# Get API endpoint URL
# Use in frontend NEXT_PUBLIC_LAMBDA_URL
```

### Deploy Frontend to Vercel

```bash
cd frontend
npm install -g vercel
vercel

# Set environment variable
# NEXT_PUBLIC_LAMBDA_URL = your API Gateway URL
```

## 📝 License

Portfolio project - AI CloudOps Copilot

## 👤 Author

Built by [Your Name] for AWS DevOps Intelligence

---

**Status:** ✅ Phases 1-5 Complete | Phase 6+ Ready for Enhancement

For questions or issues, please refer to the troubleshooting section above.
