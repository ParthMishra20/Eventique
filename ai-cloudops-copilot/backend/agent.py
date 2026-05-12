"""
LangChain agent for AWS DevOps root cause analysis.
Orchestrates tools (metrics, logs, incident search) with Groq LLM.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Global state for tools
_rag_vectorstore = None
_embeddings = None

# Shared lists to track tool outputs
LOGS_USED = []
SIMILAR_INCIDENTS = []


def _load_vectorstore():
    """Load FAISS vectorstore lazily."""
    global _rag_vectorstore, _embeddings

    if _rag_vectorstore is None:
        # Use absolute path for vectorstore
        vectorstore_path = os.path.join(
            os.path.dirname(__file__),
            'vectorstore',
            'faiss_index'
        )

        if not os.path.exists(vectorstore_path):
            raise FileNotFoundError(
                f"Vectorstore not found at {vectorstore_path}. "
                "Please run: python scripts/build_vectorstore.py"
            )

        try:
            _embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            _rag_vectorstore = FAISS.load_local(
                vectorstore_path,
                _embeddings,
                allow_dangerous_deserialization=True
            )
        except Exception as e:
            print(
                f"Error loading vectorstore from {vectorstore_path}: {str(e)}")
            raise

    return _rag_vectorstore


# ============================================================================
# TOOL 1: Get EC2 Metrics
# ============================================================================

@tool
def get_ec2_metrics() -> str:
    """
    Fetch mock EC2 CloudWatch metrics including CPU, memory, disk, and network.
    Simulates a real AWS CloudWatch API response.

    Returns:
        Formatted string with EC2 metrics data
    """
    backend_dir = Path(__file__).parent
    metrics_file = backend_dir / "mock_data" / "metrics" / "ec2_metrics.json"

    if not metrics_file.exists():
        return "Error: EC2 metrics file not found"

    with open(metrics_file, "r") as f:
        metrics_data = json.load(f)

    # Format metrics into readable string
    formatted = "EC2 METRICS (Instance: i-0a3f5c2b1d9e4f7a)\n"
    formatted += "=" * 50 + "\n"

    for metric in metrics_data["MetricData"]:
        metric_name = metric["MetricName"]
        formatted += f"\n{metric_name}:\n"

        for dp in metric.get("Datapoints", []):
            timestamp = dp["Timestamp"]
            value = dp.get("Average") or dp.get("Sum") or dp.get("Maximum")
            unit = dp.get("Unit", "")
            formatted += f"  {timestamp}: {value} {unit}\n"

    return formatted


# ============================================================================
# TOOL 2: Get Recent Logs
# ============================================================================

@tool
def get_recent_logs() -> str:
    """
    Fetch mock CloudWatch logs simulating a CPU spike scenario.
    Returns realistic AWS log entries with timestamps and levels.
    Stores each log in the global LOGS_USED list.

    Returns:
        Formatted string with log entries
    """
    logs = [
        "2026-05-10T14:10:23.456Z [INFO] Application started, memory usage: 1.2GB",
        "2026-05-10T14:15:12.789Z [INFO] Incoming request spike detected: 450 req/sec",
        "2026-05-10T14:15:45.123Z [WARN] High database connection count: 8,234 active connections (max: 10,000)",
        "2026-05-10T14:20:01.567Z [ERROR] Connection pool exhausted, new requests queued: 2,145 pending",
        "2026-05-10T14:20:34.890Z [ERROR] Unable to acquire connection from pool after 30s timeout",
        "2026-05-10T14:25:12.234Z [ERROR] Request handler failed: db.close() not called, connection leaked",
        "2026-05-10T14:30:45.678Z [WARN] Memory pressure high: 6.8GB of 8GB heap used (85%)",
        "2026-05-10T14:35:02.345Z [INFO] Application restarted, pool flushed, memory reset to 1.5GB"
    ]

    # Append each log to the global LOGS_USED list
    for log in logs:
        LOGS_USED.append(log)

    formatted = "CLOUDWATCH LOGS (prod-web-server)\n"
    formatted += "=" * 60 + "\n\n"

    for log in logs:
        formatted += log + "\n"

    return formatted


# ============================================================================
# TOOL 3: Search Similar Incidents
# ============================================================================

@tool
def search_incidents(query: str) -> str:
    """
    Search FAISS vectorstore for similar past incidents using semantic similarity.
    Stores each found incident in the global SIMILAR_INCIDENTS list.

    Args:
        query: Search query describing the issue (e.g., "EC2 CPU high")

    Returns:
        Formatted string with top 3 similar incidents
    """
    try:
        vectorstore = _load_vectorstore()

        # Search with similarity scores
        results = vectorstore.similarity_search_with_score(query, k=3)

        formatted = f"SIMILAR INCIDENTS (Query: '{query}')\n"
        formatted += "=" * 60 + "\n"

        for i, (doc, score) in enumerate(results, 1):
            incident_name = doc.metadata.get("source", "Unknown")
            chunk_index = doc.metadata.get("chunk_index", 0)
            snippet = doc.page_content[:250]

            # Store incident in global list
            incident_entry = f"{incident_name} (Chunk {chunk_index}) - Similarity: {score:.4f}"
            SIMILAR_INCIDENTS.append(incident_entry)

            formatted += f"\n{i}. {incident_name} (Chunk {chunk_index})\n"
            formatted += f"   Similarity Score: {score:.4f}\n"
            formatted += f"   Preview: {snippet}...\n"

        return formatted

    except Exception as e:
        error_msg = f"Error searching incidents: {str(e)}"
        print(f"DEBUG: {error_msg}")
        return error_msg


# ============================================================================
# LangChain Agent Setup
# ============================================================================

def create_devops_agent():
    """Create and configure the LangGraph DevOps agent."""

    # Initialize Groq LLM
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError(
            "GROQ_API_KEY not found in environment. "
            "Please set it in your .env file or environment variables."
        )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=api_key,
        temperature=0.2  # Lower temperature for more deterministic responses
    )

    # System prompt for the agent
    system_prompt = """You are a senior AWS DevOps engineer. Given the following metrics, logs, and past incidents, perform root cause analysis and give step-by-step fixes. Be concise and structured.

When analyzing issues:
1. Examine metrics for anomalies (CPU spikes, memory growth, connection issues)
2. Review logs for error patterns and timestamps
3. Compare with similar incidents to identify patterns
4. Provide specific, actionable remediation steps
5. Structure your response clearly with sections"""

    # Bind system message to LLM
    llm_with_system = llm.bind(system_prompt=system_prompt)

    # Define tools
    tools = [get_ec2_metrics, get_recent_logs, search_incidents]

    # Create the agent using LangGraph
    agent = create_react_agent(
        llm_with_system,
        tools,
        prompt="You are a senior AWS DevOps engineer. Use ONLY these tools: get_ec2_metrics, get_recent_logs, search_incidents. Never call brave_search or any web search tool."
    )

    return agent


# ============================================================================
# Agent Executor
# ============================================================================

def run_agent(query: str, verbose: bool = False) -> dict:
    """
    Run the DevOps agent on a user query and return structured output.

    Args:
        query: User query (e.g., "Why is my EC2 slow?")
        verbose: Print detailed agent execution steps

    Returns:
        Dictionary with keys:
        - summary: Root cause analysis summary
        - logs_used: List of relevant log lines (from get_recent_logs tool)
        - similar_incidents: List of similar past incidents (from search_incidents tool)
        - recommended_fix: Step-by-step fix instructions
    """
    try:
        # Clear shared lists before invoking agent
        LOGS_USED.clear()
        SIMILAR_INCIDENTS.clear()

        # Create agent
        agent = create_devops_agent()

        if verbose:
            print(f"\n🔍 Analyzing: {query}")
            print("-" * 60)

        # Run agent with message format
        result = agent.invoke({
            "messages": [("user", query)]
        })

        # Extract response from last message
        response = result["messages"][-1].content

        # Parse agent output into structured format
        parsed = _parse_agent_output(response)

        # Include tool outputs from shared lists
        return {
            "summary": parsed.get("summary", response),
            "logs_used": LOGS_USED,  # Use the collected logs from tool
            # Use the collected incidents from tool
            "similar_incidents": SIMILAR_INCIDENTS,
            "recommended_fix": parsed.get("recommended_fix", [])
        }

    except Exception as e:
        return {
            "summary": f"Error: {str(e)}",
            "logs_used": [],
            "similar_incidents": [],
            "recommended_fix": ["Please check GROQ_API_KEY and vectorstore setup"]
        }


def _parse_agent_output(output: str) -> dict:
    """Parse agent output into structured sections."""
    parsed = {
        "summary": "",
        "logs_used": [],
        "similar_incidents": [],
        "recommended_fix": []
    }

    # Simple parsing logic - can be enhanced
    lines = output.split("\n")
    current_section = "summary"

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Detect section headers
        if "root cause" in line.lower():
            current_section = "summary"
        elif "log" in line.lower():
            current_section = "logs_used"
        elif "incident" in line.lower():
            current_section = "similar_incidents"
        elif "fix" in line.lower() or "step" in line.lower():
            current_section = "recommended_fix"

        # Add content to appropriate section
        if current_section == "summary":
            parsed["summary"] += line + "\n"
        elif current_section == "logs_used" and line.startswith("-"):
            parsed["logs_used"].append(line[1:].strip())
        elif current_section == "similar_incidents" and line.startswith("-"):
            parsed["similar_incidents"].append(line[1:].strip())
        elif current_section == "recommended_fix" and (line.startswith("-") or line[0].isdigit()):
            if line.startswith("-"):
                parsed["recommended_fix"].append(line[1:].strip())
            else:
                parsed["recommended_fix"].append(line)

    # Fallback: use full output as summary if parsing didn't work well
    if not parsed["summary"]:
        parsed["summary"] = output

    return parsed


if __name__ == "__main__":
    # Test the agent
    test_query = "Why is my EC2 instance running at 98% CPU?"

    print("Testing DevOps Agent...")
    result = run_agent(test_query, verbose=True)

    print("\n" + "=" * 60)
    print("AGENT OUTPUT")
    print("=" * 60)
    print(json.dumps(result, indent=2))
