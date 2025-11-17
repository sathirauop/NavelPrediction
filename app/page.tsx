"use client";

import { useState } from "react";
import PredictionForm from "@/components/PredictionForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import { PredictionResult } from "@/lib/types";
import Link from "next/link";

export default function Home() {
  const [result, setResult] = useState<PredictionResult | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Naval Predictions
              </h1>
              <p className="text-sm text-gray-600">
                SLNS Gajabahu No. 02 Generator Health Monitor
              </p>
            </div>
            <Link
              href="/history"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View History
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Input Form */}
          <div>
            <PredictionForm onResult={setResult} />
          </div>

          {/* Right Column: Results */}
          <div>
            {result ? (
              <ResultsDisplay result={result} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-gray-600">
                  Enter engine data and click "Analyze Engine Health" to get predictions
                </p>
                <div className="mt-6 text-sm text-gray-500 space-y-2">
                  <p className="font-semibold">How it works:</p>
                  <ol className="list-decimal list-inside text-left max-w-md mx-auto space-y-1">
                    <li>ML model generates initial health score</li>
                    <li>Historical data is analyzed for trends</li>
                    <li>Gemini AI provides final assessment</li>
                    <li>Result is stored for future reference</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <div className="bg-green-100 rounded-full p-3 mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Hybrid AI</h3>
            </div>
            <p className="text-sm text-gray-600">
              Combines ML predictions with Gemini's contextual analysis for accurate assessments
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <div className="bg-blue-100 rounded-full p-3 mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Trend Analysis</h3>
            </div>
            <p className="text-sm text-gray-600">
              Tracks engine health over time to detect degradation patterns early
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-3">
              <div className="bg-purple-100 rounded-full p-3 mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Structured Output</h3>
            </div>
            <p className="text-sm text-gray-600">
              Professional assessments from predefined categories, not chatbot responses
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
