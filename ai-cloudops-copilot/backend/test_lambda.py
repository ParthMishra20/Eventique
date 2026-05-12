#!/usr/bin/env python3
"""
Local test script for Lambda handler.
Tests the DevOps agent Lambda handler without deploying to AWS.
"""

from lambda_handler import lambda_handler
import json
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))


def test_lambda_handler():
    """Test the Lambda handler with a mock event."""

    print("=" * 70)
    print("Testing Lambda Handler - AI CloudOps Copilot")
    print("=" * 70)

    # Test 1: Normal query
    print("\n[TEST 1] Normal query - EC2 CPU spike")
    print("-" * 70)

    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "query": "Why is my EC2 instance running at 98% CPU?"
        })
    }

    context = {}

    response = lambda_handler(event, context)

    print(f"Status Code: {response['statusCode']}")
    print(f"Headers: {response['headers']}")

    body = json.loads(response["body"])
    print(f"\nResponse Body:")
    print(f"  - Summary: {body.get('summary', 'N/A')[:150]}...")
    print(f"  - Logs Used: {len(body.get('logs_used', []))} entries")
    print(
        f"  - Similar Incidents: {len(body.get('similar_incidents', []))} incidents")
    print(f"  - Recommended Fix: {len(body.get('recommended_fix', []))} steps")

    # Test 2: Missing query field
    print("\n[TEST 2] Missing query field")
    print("-" * 70)

    event = {
        "httpMethod": "POST",
        "body": json.dumps({})
    }

    response = lambda_handler(event, context)
    body = json.loads(response["body"])

    print(f"Status Code: {response['statusCode']}")
    print(f"Error: {body.get('error', 'N/A')}")

    # Test 3: Invalid JSON
    print("\n[TEST 3] Invalid JSON in body")
    print("-" * 70)

    event = {
        "httpMethod": "POST",
        "body": "not valid json"
    }

    response = lambda_handler(event, context)
    body = json.loads(response["body"])

    print(f"Status Code: {response['statusCode']}")
    print(f"Error: {body.get('error', 'N/A')}")

    # Test 4: OPTIONS preflight
    print("\n[TEST 4] CORS preflight (OPTIONS)")
    print("-" * 70)

    event = {
        "httpMethod": "OPTIONS"
    }

    response = lambda_handler(event, context)

    print(f"Status Code: {response['statusCode']}")
    print(
        f"CORS Headers Present: {all(h in response['headers'] for h in ['Access-Control-Allow-Origin', 'Access-Control-Allow-Methods'])}")

    # Test 5: Different query type
    print("\n[TEST 5] Different query - RDS slow queries")
    print("-" * 70)

    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "query": "My RDS database is experiencing slow queries"
        })
    }

    response = lambda_handler(event, context)
    body = json.loads(response["body"])

    print(f"Status Code: {response['statusCode']}")
    print(f"Summary (first 200 chars): {body.get('summary', 'N/A')[:200]}...")

    print("\n" + "=" * 70)
    print("✓ All tests completed successfully")
    print("=" * 70)


if __name__ == "__main__":
    try:
        test_lambda_handler()
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
