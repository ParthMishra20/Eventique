"""
Local FastAPI server for testing the Lambda handler.
Simulates AWS Lambda + API Gateway for local development.

Run with:
  pip install fastapi uvicorn
  uvicorn local_server:app --port 8000 --reload
"""

from lambda_handler import lambda_handler
import os
import sys
import json
import uuid
from pathlib import Path
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Add backend to path so we can import lambda_handler
sys.path.insert(0, str(Path(__file__).parent))


app = FastAPI(
    title="AI CloudOps Copilot - Local Server",
    version="0.1.0",
    description="Local FastAPI server that wraps the Lambda handler for testing"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MockContext:
    """Mock AWS Lambda context object."""

    def __init__(self):
        self.function_name = "ai-cloudops-copilot-local"
        self.function_version = "$LATEST"
        self.invoked_function_arn = "arn:aws:lambda:us-east-1:000000000000:function:ai-cloudops-copilot-local"
        self.memory_limit_in_mb = 3008
        self.aws_request_id = "local-test-request-id"
        self.log_group_name = "/aws/lambda/ai-cloudops-copilot-local"
        self.log_stream_name = "2026/05/12/[$LATEST]local-test"


@app.post("/query")
async def query(request: Request):
    """
    POST /query - Main endpoint for querying the DevOps agent.

    Expected request body:
    {
        "query": "Why is my EC2 slow?"
    }
    """
    try:
        body = await request.json()

        # Create a mock API Gateway event
        event = {
            "httpMethod": "POST",
            "body": json.dumps(body),
            "headers": {
                "Content-Type": "application/json"
            },
            "requestContext": {
                "identity": {
                    "sourceIp": request.client.host if request.client else "127.0.0.1"
                }
            }
        }

        # Create mock Lambda context
        context = MockContext()

        # Call the Lambda handler
        response = lambda_handler(event, context)

        # Parse response body if it's a string
        body_content = response.get("body")
        if isinstance(body_content, str):
            body_content = json.loads(body_content)

        return JSONResponse(
            status_code=response.get("statusCode", 200),
            content=body_content,
            headers=response.get("headers", {})
        )

    except Exception as e:
        print(f"Error in /query endpoint: {e}")
        import traceback
        traceback.print_exc()

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "details": str(e)
            }
        )


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    POST /transcribe - Local mock transcription endpoint.

    For local testing only. In production, this would call AWS Transcribe.
    Accepts audio file and returns a mock transcript.
    """
    try:
        # Read the audio file
        audio_data = await file.read()

        if not audio_data:
            return JSONResponse(
                status_code=400,
                content={"error": "No audio data received"}
            )

        # Mock transcription - in production, would call AWS Transcribe
        # For local testing, return a plausible transcript
        mock_transcripts = [
            "Why is my EC2 instance running at high CPU utilization?",
            "Our database is experiencing connection pool exhaustion",
            "Lambda function is timing out on cold starts",
            "RDS instance has high memory usage and slow queries",
            "Why are we seeing elevated latency on our API endpoints?",
        ]

        import random
        mock_transcript = random.choice(mock_transcripts)

        job_name = f"transcribe-{uuid.uuid4().hex[:12]}"

        print(f"📝 Mock transcription: {mock_transcript}")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "transcript": mock_transcript,
                "job_name": job_name,
                "note": "This is a mock transcription for local testing"
            }
        )

    except Exception as e:
        print(f"Error in /transcribe endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Transcription failed",
                "details": str(e)
            }
        )


@app.options("/query")
async def query_options():
    """Handle CORS preflight requests."""
    return JSONResponse(
        status_code=200,
        content={"message": "CORS preflight OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )


@app.options("/transcribe")
async def transcribe_options():
    """Handle CORS preflight requests for transcribe."""
    return JSONResponse(
        status_code=200,
        content={"message": "CORS preflight OK"},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "AI CloudOps Copilot - Local Server",
        "version": "0.1.0"
    }


@app.get("/")
async def root():
    """Root endpoint with API documentation."""
    return {
        "name": "AI CloudOps Copilot - Local Development Server",
        "version": "0.1.0",
        "description": "FastAPI wrapper for Lambda handler testing",
        "endpoints": {
            "POST /query": "Submit a DevOps query for analysis",
            "POST /transcribe": "Transcribe audio (mock for local testing)",
            "GET /health": "Check server health",
            "GET /": "This documentation"
        },
        "example_requests": {
            "query": {
                "method": "POST",
                "url": "http://localhost:8000/query",
                "body": {
                    "query": "Why is my EC2 instance running at 98% CPU?"
                }
            },
            "transcribe": {
                "method": "POST",
                "url": "http://localhost:8000/transcribe",
                "body": "multipart/form-data with 'file' field containing audio"
            }
        },
        "docs": "http://localhost:8000/docs",
        "redoc": "http://localhost:8000/redoc"
    }


if __name__ == "__main__":
    import uvicorn

    print("=" * 70)
    print("🚀 AI CloudOps Copilot - Local Development Server")
    print("=" * 70)
    print("\n📡 Starting server on http://localhost:8000")
    print("\n📚 Interactive API docs available at:")
    print("   - Swagger UI: http://localhost:8000/docs")
    print("   - ReDoc: http://localhost:8000/redoc")
    print("\n💡 Try a test query:")
    print('   curl -X POST http://localhost:8000/query \\')
    print('     -H "Content-Type: application/json" \\')
    print('     -d \'{"query": "Why is my EC2 slow?"}\'')
    print("\n" + "=" * 70 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000)
