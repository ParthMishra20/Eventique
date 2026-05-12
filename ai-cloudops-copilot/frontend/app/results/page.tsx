"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AnalysisResult {
  summary: string;
  logs_used: string[];
  similar_incidents: string[];
  recommended_fix: string[] | string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored result:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">
            No results found
          </h2>
          <p className="text-gray-400 mb-6">
            Please go back and submit a query first.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const recommendedFixArray = Array.isArray(result.recommended_fix)
    ? result.recommended_fix
    : result.recommended_fix
        .split("\n")
        .filter((line: string) => line.trim());

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-white mb-2">
            Root Cause Analysis
          </h1>
          <p className="text-gray-400">
            AI-powered insights from your AWS infrastructure
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Issue Summary Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📋</div>
              <h2 className="text-xl font-bold text-white">Issue Summary</h2>
            </div>
            <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
              {result.summary || "No summary available"}
            </div>
          </div>

          {/* Relevant Logs Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-amber-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">📝</div>
              <h2 className="text-xl font-bold text-white">Relevant Logs</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.logs_used && result.logs_used.length > 0 ? (
                result.logs_used.map((log, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-300 p-2 bg-gray-900/50 rounded border border-gray-700/50 font-mono"
                  >
                    • {log}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No logs available
                </p>
              )}
            </div>
          </div>

          {/* Similar Incidents Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 hover:border-green-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">🔍</div>
              <h2 className="text-xl font-bold text-white">
                Similar Past Incidents
              </h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.similar_incidents && result.similar_incidents.length > 0 ? (
                result.similar_incidents.map((incident, idx) => (
                  <div
                    key={idx}
                    className="text-sm text-gray-300 p-2 bg-gray-900/50 rounded border border-gray-700/50"
                  >
                    • {incident}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No similar incidents found
                </p>
              )}
            </div>
          </div>

          {/* Recommended Fix Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-lg p-6 border border-blue-700/50 hover:border-blue-500 transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-2xl">⚡</div>
              <h2 className="text-xl font-bold text-white">
                Recommended Fix
              </h2>
            </div>
            <div className="space-y-3">
              {recommendedFixArray && recommendedFixArray.length > 0 ? (
                recommendedFixArray.map((step, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="text-gray-200 leading-relaxed pt-1">
                      {step
                        .replace(/^\d+\.\s*/, "")
                        .replace(/^-\s*/, "")}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm italic">
                  No fix recommendations available
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
          >
            ← New Analysis
          </Link>
          <button
            onClick={() => {
              const resultText = `
CLOUDOPS ANALYSIS REPORT
========================

ISSUE SUMMARY:
${result.summary}

RELEVANT LOGS:
${result.logs_used?.join("\n") || "N/A"}

SIMILAR INCIDENTS:
${result.similar_incidents?.join("\n") || "N/A"}

RECOMMENDED FIXES:
${recommendedFixArray.join("\n")}
              `.trim();

              navigator.clipboard.writeText(resultText);
              alert("Analysis copied to clipboard!");
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-all"
          >
            📋 Copy Report
          </button>
        </div>
      </div>
    </div>
  );
}
