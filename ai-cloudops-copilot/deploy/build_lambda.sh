#!/bin/bash

# Lambda Deployment Package Builder
# This script creates a deployable Lambda package from the deploy/ folder

set -e  # Exit on error

PROJECT_ROOT=$(cd "$(dirname "$0")/../" && pwd)
DEPLOY_DIR="$PROJECT_ROOT/deploy"
BUILD_DIR="$DEPLOY_DIR/build"
BACKEND_DIR="$PROJECT_ROOT/backend"

LIGHT_PACKAGES=(
    langchain
    langchain-core
    langchain-groq
    langchain-community
    langchain-text-splitters
    langchain-huggingface
    langgraph
    python-dotenv
)

echo "=================================================="
echo "🚀 AI CloudOps Copilot - Lambda Package Builder"
echo "=================================================="
echo ""

# Step 1: Clean and create build directory
echo "📁 Step 1: Preparing build directory..."
if [ -d "$BUILD_DIR" ]; then
    echo "   Removing existing build directory..."
    rm -rf "$BUILD_DIR"
fi
mkdir -p "$BUILD_DIR"
echo "   ✅ Build directory ready: $BUILD_DIR"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing Python dependencies..."
echo "   Running: pip install light runtime packages -t ./lib/"
cd "$BUILD_DIR"
python -m pip install --upgrade pip --quiet
python -m pip install --no-cache-dir --quiet -t ./lib/ "${LIGHT_PACKAGES[@]}"
echo "   ✅ Dependencies installed to lib/"
echo ""

# Step 3: Copy deploy files (lambda_handler.py, agent.py, rag.py)
echo "📄 Step 3: Copying core files..."
cp "$DEPLOY_DIR/lambda_handler.py" "$BUILD_DIR/"
echo "   ✅ Copied: lambda_handler.py"
cp "$DEPLOY_DIR/agent.py" "$BUILD_DIR/"
echo "   ✅ Copied: agent.py"
cp "$DEPLOY_DIR/rag.py" "$BUILD_DIR/"
echo "   ✅ Copied: rag.py"
echo ""

# Remove numpy from the deployment package because it is provided by the layer
if [ -d "$BUILD_DIR/lib/numpy" ]; then
    rm -rf "$BUILD_DIR/lib/numpy"
fi
find "$BUILD_DIR/lib" -maxdepth 1 \( -name "numpy-*" -o -name "numpy.libs" \) -exec rm -rf {} + 2>/dev/null || true

# Step 4: Copy mock_data folder
echo "📊 Step 4: Copying mock data..."
if [ -d "$BACKEND_DIR/mock_data" ]; then
    cp -r "$BACKEND_DIR/mock_data" "$BUILD_DIR/"
    echo "   ✅ Copied: mock_data/ ($(find "$BUILD_DIR/mock_data" -type f | wc -l) files)"
else
    echo "   ⚠️  Warning: mock_data/ not found in backend"
fi
echo ""

# Step 5: Copy vectorstore folder
echo "🔍 Step 5: Copying vectorstore..."
if [ -d "$BACKEND_DIR/vectorstore" ]; then
    cp -r "$BACKEND_DIR/vectorstore" "$BUILD_DIR/"
    VECTORSTORE_SIZE=$(du -sh "$BUILD_DIR/vectorstore" | cut -f1)
    echo "   ✅ Copied: vectorstore/ ($VECTORSTORE_SIZE)"
else
    echo "   ⚠️  Warning: vectorstore/ not found in backend"
    echo "   💡 Tip: Run 'python scripts/build_vectorstore.py' to create it"
fi
echo ""

# Step 6: Create zip file
echo "📦 Step 6: Creating Lambda package..."
cd "$DEPLOY_DIR"
if [ -f "lambda_package.zip" ]; then
    rm "lambda_package.zip"
    echo "   Removed existing lambda_package.zip"
fi

cd "$BUILD_DIR"
zip -r "$DEPLOY_DIR/lambda_package.zip" . > /dev/null 2>&1
PACKAGE_SIZE=$(du -h "$DEPLOY_DIR/lambda_package.zip" | cut -f1)

echo "   ✅ Created: lambda_package.zip ($PACKAGE_SIZE)"
echo ""

# Step 7: Summary and next steps
echo "=================================================="
echo "✅ Lambda package ready for deployment!"
echo "=================================================="
echo ""
echo "📍 Package location:"
echo "   $DEPLOY_DIR/lambda_package.zip"
echo ""
echo "📊 Package contents:"
echo "   ├── lambda_handler.py (entry point)"
echo "   ├── agent.py (DevOps agent)"
echo "   ├── rag.py (RAG pipeline)"
echo "   ├── mock_data/ (incident reports & metrics)"
echo "   ├── vectorstore/ (FAISS index)"
echo "   └── lib/ (Python dependencies)"
echo ""
echo "🚀 Next steps:"
echo "   1. Go to AWS Lambda console"
echo "   2. Create new function: Python 3.11, 512MB memory, 60s timeout"
echo "   3. Upload lambda_package.zip"
echo "   4. Set handler to: lambda_handler.lambda_handler"
echo "   5. Set environment variable: GROQ_API_KEY=your_key_here"
echo "   6. Create API Gateway REST API with POST /query"
echo "   7. Use Lambda's built-in boto3/botocore runtime instead of packaging them"
echo ""
echo "💡 Troubleshooting:"
if [ ! -d "$BUILD_DIR/vectorstore" ]; then
    echo "   ⚠️  vectorstore/ is missing!"
    echo "      Run: python scripts/build_vectorstore.py"
fi
if [ ! -d "$BUILD_DIR/mock_data" ]; then
    echo "   ⚠️  mock_data/ is missing!"
    echo "      This should exist from Phase 1"
fi

PACKAGE_BYTES=$(stat -f%z "$DEPLOY_DIR/lambda_package.zip")
if [ "$PACKAGE_BYTES" -gt 52428800 ]; then
    echo "   ⚠️  lambda_package.zip is over 50 MB compressed"
    echo "      Consider moving more packages into the layer if needed"
fi
echo ""
