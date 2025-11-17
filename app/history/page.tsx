"use client";

import { useEffect, useState } from "react";
import { HistoricalDataPoint } from "@/lib/types";
import HistoryTable from "@/components/HistoryTable";
import Link from "next/link";

export default function HistoryPage() {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }
      const result = await response.json();
      setData(result.data.reverse()); // Show most recent first
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
              <p className="text-sm text-gray-600">
                Historical engine health predictions and trends
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Prediction
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center text-red-600">
              <svg
                className="mx-auto h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-semibold">Error loading history</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No History Yet</h3>
            <p className="text-gray-600 mb-4">
              Make your first prediction to start tracking engine health
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Prediction
            </Link>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Total Predictions</div>
                <div className="text-3xl font-bold text-gray-900">{data.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Latest Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {(data[0].gemini_final_score * 100).toFixed(1)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Average Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {(
                    (data.reduce((sum, d) => sum + d.gemini_final_score, 0) / data.length) *
                    100
                  ).toFixed(1)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600 mb-1">Latest Status</div>
                <div className="text-lg font-bold text-gray-900">
                  {data[0].status.replace(/_/g, " ")}
                </div>
              </div>
            </div>

            {/* History Table */}
            <HistoryTable data={data} />
          </>
        )}
      </main>
    </div>
  );
}
