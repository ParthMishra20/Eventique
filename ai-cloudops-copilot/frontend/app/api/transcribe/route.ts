import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/transcribe
 * Receives audio blob from frontend microphone recording
 * Sends to backend transcribe endpoint
 * Returns transcript text
 */
export async function POST(request: NextRequest) {
  try {
    // Get LAMBDA_URL from environment
    const lambdaUrl = process.env.LAMBDA_URL || process.env.NEXT_PUBLIC_LAMBDA_URL || 'http://localhost:8000';

    // Get audio file from request
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Create new FormData to send to backend
    const backendFormData = new FormData();
    backendFormData.append('audio', audioFile, 'recording.wav');

    // Send to backend transcribe endpoint
    const response = await fetch(`${lambdaUrl}/transcribe`, {
      method: 'POST',
      body: backendFormData
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Transcription failed' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: true,
        transcript: data.transcript,
        jobName: data.job_name
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription request' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  }
}

/**
 * OPTIONS /api/transcribe
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
}
