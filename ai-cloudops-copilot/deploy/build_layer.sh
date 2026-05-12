#!/bin/bash

# Lambda Layer Builder for heavy ML dependencies
# Produces lambda_layer.zip containing layer/python/*

set -euo pipefail

PROJECT_ROOT=$(cd "$(dirname "$0")/../" && pwd)
DEPLOY_DIR="$PROJECT_ROOT/deploy"
LAYER_DIR="$DEPLOY_DIR/layer"
LAYER_PYTHON_DIR="$LAYER_DIR/python"

HEAVY_PACKAGES=(
    faiss-cpu
    sentence-transformers
)

TORCH_INDEX_URL="https://download.pytorch.org/whl/cpu"


echo "=================================================="
echo "🧱 AI CloudOps Copilot - Lambda Layer Builder"
echo "=================================================="
echo ""

# Step 1: Prepare layer directory
if [ -d "$LAYER_DIR" ]; then
    echo "📁 Removing existing layer directory..."
    rm -rf "$LAYER_DIR"
fi
mkdir -p "$LAYER_PYTHON_DIR"
echo "✅ Layer directory ready: $LAYER_PYTHON_DIR"
echo ""

# Step 2: Install heavy packages into layer/python/
echo "📦 Installing heavy packages into layer/python/..."
echo "   - faiss-cpu"
echo "   - sentence-transformers"
echo "   - torch (CPU only)"

python -m pip install --upgrade pip --quiet

python -m pip install \
  --no-cache-dir \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.11 \
  --only-binary=:all: \
  --no-deps \
  --target "$LAYER_PYTHON_DIR" \
  "${HEAVY_PACKAGES[@]}"

python -m pip install \
  --no-cache-dir \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.11 \
  --only-binary=:all: \
  --target "$LAYER_PYTHON_DIR" \
  numpy

python -m pip install \
  --no-cache-dir \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.11 \
  --only-binary=:all: \
  --target "$LAYER_PYTHON_DIR" \
  --extra-index-url "$TORCH_INDEX_URL" \
  torch

echo "✅ Heavy packages installed into layer/python/"
echo ""

# Step 3: Remove obvious non-runtime artifacts to keep the layer smaller
find "$LAYER_PYTHON_DIR" -type d -name "__pycache__" -prune -exec rm -rf {} + || true
find "$LAYER_PYTHON_DIR" -type d -name "tests" -prune -exec rm -rf {} + || true
find "$LAYER_PYTHON_DIR" -type d -name "test" -prune -exec rm -rf {} + || true
find "$LAYER_PYTHON_DIR" -type d -name "*.dist-info" -prune -exec rm -rf {} + || true
find "$LAYER_PYTHON_DIR" -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete || true

# Step 4: Zip the layer
cd "$LAYER_DIR"
if [ -f "lambda_layer.zip" ]; then
    rm "lambda_layer.zip"
fi
zip -r "$DEPLOY_DIR/lambda_layer.zip" python > /dev/null 2>&1

LAYER_BYTES=$(stat -f%z "$DEPLOY_DIR/lambda_layer.zip")
LAYER_SIZE=$(du -h "$DEPLOY_DIR/lambda_layer.zip" | cut -f1)

echo ""
echo "=================================================="
echo "✅ Lambda layer ready: lambda_layer.zip"
echo "=================================================="
echo ""
echo "📍 Layer location: $DEPLOY_DIR/lambda_layer.zip"
echo "📦 Compressed size: $LAYER_SIZE"
if [ "$LAYER_BYTES" -gt 52428800 ]; then
    echo "⚠️  Note: this layer exceeds 50 MB compressed and may need S3 upload or further trimming"
fi
