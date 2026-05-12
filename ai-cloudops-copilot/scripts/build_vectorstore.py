#!/usr/bin/env python3
"""
Build and save the FAISS vectorstore for incident RAG.
Run this once to create the vectorstore before starting the application.
"""
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from rag import build_full_vectorstore
from pathlib import Path



def main():
    """Build the vectorstore."""
    print("=" * 60)
    print("Building FAISS Vectorstore for AWS Incident RAG")
    print("=" * 60)

    try:
        rag = build_full_vectorstore()
        print("\n" + "=" * 60)
        print("✓ Vectorstore built successfully")
        print("=" * 60)

        # Optional: Test the vectorstore with a sample query
        print("\nTesting vectorstore with sample query...")
        test_results = rag.search_incidents("EC2 high CPU", k=2)

        print(f"\nTop 2 similar incidents for 'EC2 high CPU':")
        for i, result in enumerate(test_results, 1):
            print(f"\n{i}. {result['incident']}")
            print(f"   Similarity Score: {result['similarity_score']:.4f}")
            print(f"   Preview: {result['snippet'][:100]}...")

    except Exception as e:
        print(f"\n✗ Error building vectorstore: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
