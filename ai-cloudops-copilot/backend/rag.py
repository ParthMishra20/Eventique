"""
RAG Pipeline for AWS incident management.
Loads incident reports, chunks them, generates embeddings, and stores in FAISS.
"""

import os
import json
from pathlib import Path
from typing import List

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document


class IncidentRAG:
    """RAG pipeline for incident reports."""

    def __init__(self):
        """Initialize the RAG pipeline with HuggingFace embeddings."""
        self.incidents_dir = Path(__file__).parent / "mock_data" / "incidents"
        self.vectorstore_dir = Path(__file__).parent / "vectorstore"
        self.vectorstore_dir.mkdir(parents=True, exist_ok=True)

        # Initialize embeddings model
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", " ", ""]
        )

        self.vectorstore = None

    def load_incidents(self) -> List[Document]:
        """Load all incident .txt files and convert to LangChain Documents."""
        documents = []

        if not self.incidents_dir.exists():
            raise FileNotFoundError(
                f"Incidents directory not found: {self.incidents_dir}")

        incident_files = sorted(self.incidents_dir.glob("*.txt"))

        if not incident_files:
            raise FileNotFoundError(
                f"No .txt files found in {self.incidents_dir}")

        print(f"Loading {len(incident_files)} incident files...")

        for incident_file in incident_files:
            with open(incident_file, "r", encoding="utf-8") as f:
                content = f.read()

            # Extract date from filename (e.g., "ec2_high_cpu_incident_20260510.txt")
            filename = incident_file.stem
            metadata = {
                "source": filename,
                "file_path": str(incident_file)
            }

            doc = Document(page_content=content, metadata=metadata)
            documents.append(doc)

        print(f"Loaded {len(documents)} incident documents")
        return documents

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """Split documents into chunks using RecursiveCharacterTextSplitter."""
        print(f"Chunking {len(documents)} documents...")

        chunks = []
        for doc in documents:
            split_texts = self.text_splitter.split_text(doc.page_content)

            for i, chunk_text in enumerate(split_texts):
                chunk_metadata = doc.metadata.copy()
                chunk_metadata["chunk_index"] = i
                chunk_doc = Document(
                    page_content=chunk_text,
                    metadata=chunk_metadata
                )
                chunks.append(chunk_doc)

        print(f"Created {len(chunks)} text chunks (avg chunk size: 500 chars)")
        return chunks

    def build_vectorstore(self, documents: List[Document]):
        """Build FAISS vectorstore from chunked documents."""
        print(f"Building FAISS vectorstore with {len(documents)} chunks...")

        self.vectorstore = FAISS.from_documents(
            documents,
            self.embeddings
        )

        print(f"Vectorstore built successfully with {len(documents)} chunks")

    def save_vectorstore(self):
        """Save FAISS vectorstore to disk."""
        if self.vectorstore is None:
            raise ValueError(
                "Vectorstore not built yet. Call build_vectorstore() first.")

        vectorstore_path = self.vectorstore_dir / "faiss_index"
        self.vectorstore.save_local(str(vectorstore_path))
        print(f"Vectorstore saved to {vectorstore_path}")

    def load_vectorstore(self):
        """Load FAISS vectorstore from disk."""
        vectorstore_path = self.vectorstore_dir / "faiss_index"

        if not vectorstore_path.exists():
            raise FileNotFoundError(
                f"Vectorstore not found at {vectorstore_path}")

        self.vectorstore = FAISS.load_local(
            str(vectorstore_path),
            self.embeddings
        )
        print(f"Vectorstore loaded from {vectorstore_path}")
        return self.vectorstore

    def search_incidents(self, query: str, k: int = 3) -> List[dict]:
        """Search for similar incidents using semantic similarity.

        Args:
            query: Search query (e.g., "EC2 CPU spike")
            k: Number of results to return

        Returns:
            List of similar incidents with scores
        """
        if self.vectorstore is None:
            self.load_vectorstore()

        # Search with similarity scores
        results = self.vectorstore.similarity_search_with_score(query, k=k)

        formatted_results = []
        for doc, score in results:
            result = {
                "incident": doc.metadata.get("source", "Unknown"),
                "chunk_index": doc.metadata.get("chunk_index", 0),
                "similarity_score": float(score),
                "snippet": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
            }
            formatted_results.append(result)

        return formatted_results


def build_full_vectorstore():
    """Build and save the complete vectorstore."""
    rag = IncidentRAG()

    # Load incidents
    documents = rag.load_incidents()

    # Chunk documents
    chunks = rag.chunk_documents(documents)

    # Build vectorstore
    rag.build_vectorstore(chunks)

    # Save vectorstore
    rag.save_vectorstore()

    return rag


if __name__ == "__main__":
    rag = build_full_vectorstore()
    print("Vectorstore built successfully")
