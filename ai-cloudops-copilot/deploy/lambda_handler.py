"""
AWS Lambda handler for AI CloudOps Copilot.
Receives queries from API Gateway and returns root cause analysis from the DevOps agent.
"""

import json
import logging
from agent import run_agent

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# CORS headers for API Gateway
CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, X-Amz-Date, Authorization, X-Api-Key"
}


def lambda_handler(event, context):
    """
    AWS Lambda handler for processing DevOps queries.

    Expected event body:
    {
        "query": "Why is my EC2 slow?"
    }

    Args:
        event: API Gateway proxy event
        context: Lambda context object

    Returns:
        API Gateway proxy response with statusCode, headers, and JSON body
    """

    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Handle OPTIONS requests for CORS preflight
        if event.get("httpMethod") == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"message": "CORS preflight OK"})
            }

        # Parse request body
        body = event.get("body", "{}")

        if isinstance(body, str):
            body = json.loads(body)

        query = body.get("query")

        if not query:
            logger.error("Missing 'query' field in request body")
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({
                    "error": "Missing required field: 'query'",
                    "example": {"query": "Why is my EC2 slow?"}
                })
            }

        logger.info(f"Processing query: {query}")

        # Run the DevOps agent
        result = run_agent(query, verbose=False)

        logger.info(f"Agent analysis complete for query: {query}")

        # Return successful response
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps(result)
        }

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in request body: {str(e)}")
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": "Invalid JSON in request body",
                "details": str(e)
            })
        }

    except ValueError as e:
        # Usually from missing GROQ_API_KEY
        logger.error(f"Configuration error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": "Configuration error",
                "details": str(e)
            })
        }

    except Exception as e:
        logger.error(
            f"Unexpected error processing query: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({
                "error": "Internal server error",
                "details": str(e)
            })
        }


if __name__ == "__main__":
    # Local testing
    import sys
    sys.path.insert(0, __file__)

    test_event = {
        "httpMethod": "POST",
        "body": json.dumps({"query": "Why is my EC2 running at 98% CPU?"})
    }

    test_context = {}

    response = lambda_handler(test_event, test_context)
    print(json.dumps(response, indent=2))
