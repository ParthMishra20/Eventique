"""
AWS Transcribe integration for converting audio files to text.
Handles S3 upload, Transcribe job submission, and polling for completion.
"""

import os
import time
import uuid
import boto3
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# AWS clients
s3_client = boto3.client('s3')
transcribe_client = boto3.client('transcribe')


def transcribe_audio(audio_file_path: str, max_wait_seconds: int = 60) -> dict:
    """
    Upload audio file to S3 and transcribe using AWS Transcribe.

    Args:
        audio_file_path: Path to the audio file (WAV, MP3, etc.)
        max_wait_seconds: Maximum time to wait for transcription (default 60s)

    Returns:
        Dictionary with keys:
        - success: Boolean indicating if transcription succeeded
        - transcript: Transcribed text (if success=True)
        - error: Error message (if success=False)
        - job_name: Transcribe job name
    """

    # Validate inputs
    bucket_name = os.getenv('TRANSCRIBE_BUCKET', 'cloudops-transcribe')
    if not os.path.exists(audio_file_path):
        return {
            'success': False,
            'transcript': '',
            'error': f'Audio file not found: {audio_file_path}',
            'job_name': None
        }

    try:
        # Generate unique names
        job_name = f"transcribe-{uuid.uuid4().hex[:12]}"
        s3_key = f"audio/{job_name}.wav"

        # Step 1: Upload audio to S3
        print(f"📤 Uploading audio to S3: s3://{bucket_name}/{s3_key}")
        s3_client.upload_file(audio_file_path, bucket_name, s3_key)

        # Step 2: Start Transcribe job
        print(f"🎙️ Starting Transcribe job: {job_name}")
        media_uri = f"s3://{bucket_name}/{s3_key}"

        transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': media_uri},
            MediaFormat='wav',  # Adjust based on your audio format
            LanguageCode='en-US',
            OutputBucketName=bucket_name,
            OutputKey=f"transcripts/{job_name}.json"
        )

        # Step 3: Poll for completion
        print(f"⏳ Waiting for transcription (max {max_wait_seconds}s)...")
        start_time = time.time()

        while time.time() - start_time < max_wait_seconds:
            response = transcribe_client.get_transcription_job(
                TranscriptionJobName=job_name
            )

            status = response['TranscriptionJob']['TranscriptionJobStatus']

            if status == 'COMPLETED':
                print("✅ Transcription completed!")

                # Step 4: Download transcript from S3
                transcript_key = f"transcripts/{job_name}.json"
                response_obj = s3_client.get_object(
                    Bucket=bucket_name,
                    Key=transcript_key
                )

                import json
                transcript_data = json.loads(response_obj['Body'].read())
                transcript_text = transcript_data['results']['transcripts'][0]['transcript']

                return {
                    'success': True,
                    'transcript': transcript_text,
                    'error': None,
                    'job_name': job_name
                }

            elif status == 'FAILED':
                failure_reason = response['TranscriptionJob'].get(
                    'FailureReason',
                    'Unknown error'
                )
                return {
                    'success': False,
                    'transcript': '',
                    'error': f'Transcription failed: {failure_reason}',
                    'job_name': job_name
                }

            # Still in progress
            print(f"  Status: {status}... (waiting)")
            time.sleep(2)

        # Timeout
        return {
            'success': False,
            'transcript': '',
            'error': f'Transcription timeout after {max_wait_seconds} seconds',
            'job_name': job_name
        }

    except Exception as e:
        return {
            'success': False,
            'transcript': '',
            'error': f'Error during transcription: {str(e)}',
            'job_name': None
        }


def transcribe_from_bytes(audio_bytes: bytes, file_format: str = 'wav') -> dict:
    """
    Transcribe audio from bytes (received from frontend).
    Saves to temp file, uploads to S3, and transcribes.

    Args:
        audio_bytes: Audio data as bytes
        file_format: Audio format ('wav', 'mp3', etc.)

    Returns:
        Dictionary with transcription result
    """
    temp_file = f'/tmp/audio_{uuid.uuid4().hex[:8]}.{file_format}'

    try:
        # Write bytes to temp file
        with open(temp_file, 'wb') as f:
            f.write(audio_bytes)

        # Transcribe the temp file
        result = transcribe_audio(temp_file)

        # Cleanup
        if os.path.exists(temp_file):
            os.remove(temp_file)

        return result

    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)

        return {
            'success': False,
            'transcript': '',
            'error': f'Error processing audio bytes: {str(e)}',
            'job_name': None
        }


if __name__ == "__main__":
    # Test transcription
    import sys

    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file_path>")
        sys.exit(1)

    audio_file = sys.argv[1]
    print(f"Transcribing: {audio_file}")

    result = transcribe_audio(audio_file)
    print("\nResult:")
    print(f"  Success: {result['success']}")
    print(f"  Job: {result['job_name']}")
    if result['success']:
        print(f"  Transcript: {result['transcript']}")
    else:
        print(f"  Error: {result['error']}")
