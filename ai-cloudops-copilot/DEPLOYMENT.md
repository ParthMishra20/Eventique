# Phase 6: AWS Deployment Guide

This guide covers deploying AI CloudOps Copilot to AWS Lambda + API Gateway + Transcribe.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (`aws configure`)
- GROQ_API_KEY ready
- (Optional for Transcribe) S3 bucket for audio storage

---

## Step 1: Deploy Lambda Function

### 1.1 Create Deployment Package

```bash
cd /Users/parthmishra/Documents/GitHub/Eventique/ai-cloudops-copilot

# Create a temporary directory for Lambda deployment
mkdir lambda-deployment
cd lambda-deployment

# Copy backend files (excluding unnecessary files)
cp -r ../backend/agent.py .
cp -r ../backend/lambda_handler.py .
cp -r ../backend/rag.py .
cp -r ../backend/transcribe.py .
cp -r ../backend/vectorstore ./

# Copy all dependencies to lib folder
pip install -r ../requirements.txt -t ./lib/
# Remove unnecessary files to reduce package size
rm -rf ./lib/*.dist-info ./lib/__pycache__

# Create deployment zip
zip -r lambda_function.zip . -x "*.git*" "*.env*"

echo "✅ Created lambda_function.zip"
```

### 1.2 Upload to AWS Lambda

**Option A: AWS Console (Easiest)**

1. Go to AWS Lambda console
2. Click "Create function"
3. Choose "Author from scratch"
4. Runtime: `Python 3.11`
5. Architecture: `x86_64`
6. Click "Create function"
7. In "Code" section, click "Upload from" → "ZIP file"
8. Upload `lambda_function.zip`
9. Click "Deploy"

**Option B: AWS CLI**

```bash
aws lambda create-function \
  --function-name ai-cloudops-copilot \
  --runtime python3.11 \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
  --handler lambda_handler.lambda_handler \
  --zip-file fileb://lambda_function.zip \
  --memory-size 512 \
  --timeout 60 \
  --environment Variables={GROQ_API_KEY=your_actual_key_here}
```

### 1.3 Configure Lambda Settings

1. **Memory**: Set to 512 MB minimum
2. **Timeout**: Set to 60 seconds (vectorstore loading takes time)
3. **Environment Variables**: Add `GROQ_API_KEY`
4. **IAM Role**: Attach policies:
   - `AmazonS3ReadOnlyAccess` (for vectorstore uploads)
   - `AmazonTranscribeFullAccess` (for audio transcription)
   - `CloudWatchLogsFullAccess` (for logging)

---

## Step 2: Create API Gateway

### 2.1 Create REST API

1. Go to API Gateway console
2. Click "Create API"
3. Choose "REST API"
4. Click "Build"
5. Name: `ai-cloudops-copilot`
6. Click "Create API"

### 2.2 Create Resources and Methods

1. **Create `/query` resource**
   - Click on root resource `/`
   - Actions → Create Resource
   - Name: `query`
   - Click "Create Resource"

2. **Create POST method on `/query`**
   - Select `/query` resource
   - Actions → Create Method → POST
   - Integration type: Lambda Function
   - Lambda Function: `ai-cloudops-copilot`
   - Click "Save"
   - Click "OK" on Add Permission confirmation

3. **Enable CORS**
   - Select `/query` resource
   - Actions → Enable CORS and replace existing CORS headers
   - Default 4XX and 5XX CORS headers: Leave default
   - Click "Enable CORS and replace existing CORS headers"

### 2.3 Create `/transcribe` Resource (Optional - for Transcribe support)

1. Create `/transcribe` resource under root
2. Create POST method
3. Integration: Lambda Function → `ai-cloudops-copilot`
4. Enable CORS

### 2.4 Deploy API

1. Actions → Deploy API
2. Deployment stage: Create new stage
3. Stage name: `prod`
4. Click "Deploy"
5. **Copy the Invoke URL** (e.g., `https://xxxxx.execute-api.us-east-1.amazonaws.com/prod`)

---

## Step 3: Set Up AWS Transcribe (Optional)

### 3.1 Create S3 Bucket for Audio

```bash
# Create bucket
aws s3api create-bucket \
  --bucket cloudops-transcribe \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket cloudops-transcribe \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket cloudops-transcribe \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 3.2 Update Lambda IAM Role

Add inline policy for S3 and Transcribe:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::cloudops-transcribe/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Step 4: Update Frontend Configuration

### 4.1 Update Environment Variables

Edit `frontend/.env.local`:

```env
# Local development
NEXT_PUBLIC_LAMBDA_URL=http://localhost:8000

# Production (replace with your API Gateway URL)
# NEXT_PUBLIC_LAMBDA_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
LAMBDA_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
```

### 4.2 Rebuild Frontend (Optional)

```bash
cd frontend
npm run build
```

---

## Step 5: Test Deployment

### 5.1 Test Lambda Directly

```bash
aws lambda invoke \
  --function-name ai-cloudops-copilot \
  --payload '{"body":"{\"query\":\"Why is my EC2 slow?\"}"}' \
  response.json

cat response.json
```

### 5.2 Test via API Gateway

```bash
curl -X POST https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Why is my EC2 instance running at 98% CPU?"}'
```

### 5.3 Test Frontend Integration

1. Update `frontend/.env.local` with production Lambda URL
2. Restart frontend: `npm run dev`
3. Navigate to http://localhost:3000
4. Submit a query
5. Verify results appear

---

## Step 6: Production Deployment (Frontend)

### 6.1 Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# Follow prompts:
# - Link to existing Vercel project or create new
# - Environment variables: Set LAMBDA_URL to production API Gateway URL
```

### 6.2 Alternative: Deploy to AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure
amplify init
amplify add hosting

# Deploy
amplify publish
```

---

## Troubleshooting

### Lambda Issues

**Problem**: "Vectorstore not found"

- **Solution**: Ensure vectorstore/ folder is included in zip file
- Check: `unzip -l lambda_function.zip | grep vectorstore`

**Problem**: "GROQ_API_KEY not found"

- **Solution**: Set environment variable in Lambda configuration
- AWS Console → Lambda → ai-cloudops-copilot → Configuration → Environment variables

**Problem**: "Timeout" errors

- **Solution**: Increase Lambda timeout to 60 seconds
- AWS Console → Lambda → ai-cloudops-copilot → Configuration → General configuration

### API Gateway Issues

**Problem**: CORS errors in browser

- **Solution**: Enable CORS on /query resource
- API Gateway → Resources → /query → Actions → Enable CORS

**Problem**: 502 Bad Gateway

- **Solution**: Check Lambda logs

```bash
aws logs tail /aws/lambda/ai-cloudops-copilot --follow
```

### Transcribe Issues

**Problem**: S3 bucket not found

- **Solution**: Create S3 bucket and ensure Lambda has S3 permissions

```bash
aws s3api create-bucket --bucket cloudops-transcribe --region us-east-1
```

**Problem**: Transcribe job fails

- **Solution**: Check IAM role has AmazonTranscribeFullAccess policy

---

## Cost Estimation

| Service         | Monthly Cost (Estimate) | Notes                       |
| --------------- | ----------------------- | --------------------------- |
| Lambda          | $0.20-$2                | 1M requests @ 30GB-seconds  |
| API Gateway     | $3.50                   | 1M API calls                |
| S3 (Transcribe) | $0.50-$5                | For audio storage           |
| Transcribe      | $0.0001/sec             | Only if using voice feature |
| **Total**       | **~$5-$10/month**       | Minimal for small usage     |

---

## Monitoring & Logging

### View Lambda Logs

```bash
# Tail logs
aws logs tail /aws/lambda/ai-cloudops-copilot --follow

# View errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/ai-cloudops-copilot \
  --filter-pattern "ERROR"
```

### Set Up CloudWatch Alarms

```bash
# Alarm on errors
aws cloudwatch put-metric-alarm \
  --alarm-name ai-cloudops-errors \
  --alarm-description "Alert when Lambda errors exceed 5" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

---

## Rollback & Updates

### Update Lambda Code

```bash
# Rebuild zip
cd lambda-deployment
zip -r lambda_function.zip .

# Update function
aws lambda update-function-code \
  --function-name ai-cloudops-copilot \
  --zip-file fileb://lambda_function.zip

# Update only environment variable
aws lambda update-function-configuration \
  --function-name ai-cloudops-copilot \
  --environment Variables={GROQ_API_KEY=new_key}
```

### Rollback to Previous Version

```bash
# List versions
aws lambda list-versions-by-function --function-name ai-cloudops-copilot

# Deploy specific version
aws lambda update-alias \
  --function-name ai-cloudops-copilot \
  --name prod \
  --function-version 1
```

---

## Next Steps

- [ ] Deploy Lambda function
- [ ] Create API Gateway
- [ ] Test end-to-end locally first
- [ ] Configure Transcribe (optional)
- [ ] Deploy frontend to Vercel
- [ ] Set up monitoring and alarms
- [ ] Add database for query history (future enhancement)
- [ ] Implement user authentication (future enhancement)

---

For questions or issues, refer to AWS documentation:

- Lambda: https://docs.aws.amazon.com/lambda/
- API Gateway: https://docs.aws.amazon.com/apigateway/
- Transcribe: https://docs.aws.amazon.com/transcribe/
