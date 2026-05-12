import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid query field" },
        { status: 400 }
      );
    }

    // Get Lambda URL from environment variable (prefer LAMBDA_URL for server-side, fallback to NEXT_PUBLIC_LAMBDA_URL)
    const lambdaUrl = process.env.LAMBDA_URL || process.env.NEXT_PUBLIC_LAMBDA_URL || "http://localhost:8000";

    // Forward request to Lambda (or local server)
    const response = await fetch(`${lambdaUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: JSON.stringify({ query: query.trim() }) }),
    });

    if (!response.ok) {
      throw new Error(`Lambda returned ${response.status}`);
    }

    const result = await response.json();

    return NextResponse.json(result, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process query",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    { message: "CORS OK" },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
