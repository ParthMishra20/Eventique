FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    gcc g++ make && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    scikit-learn \
    faiss-cpu==1.7.4 \
    sentence-transformers \
    langchain \
    langchain-groq \
    langchain-community \
    langchain-text-splitters \
    langchain-huggingface \
    langgraph \
    python-dotenv \
    boto3 \
    mangum \
    awslambdaric

COPY lambda_handler.py .
COPY agent.py .
COPY rag.py .
COPY mock_data/ ./mock_data/
COPY vectorstore/ ./vectorstore/

CMD ["python", "-m", "awslambdaric", "lambda_handler.lambda_handler"]