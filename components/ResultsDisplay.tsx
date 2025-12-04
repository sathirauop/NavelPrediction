"use client";

import { PredictionResult, STATUS_DESCRIPTIONS, STATUS_COLORS } from "@/lib/types";
import jsPDF from "jspdf";

interface ResultsDisplayProps {
  result: PredictionResult;
}


export default function ResultsDisplay({ result }: ResultsDisplayProps) {
  const scorePercentage = (result.gemini_final_score * 100).toFixed(1);
  const statusColor = STATUS_COLORS[result.status];

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Engine Health Analysis", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Health Score
    doc.setFontSize(16);
    doc.text(`${scorePercentage}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Health Score", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Status
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    const statusText = result.status.replace(/_/g, " ");
    doc.text(statusText, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const statusDesc = STATUS_DESCRIPTIONS[result.status];
    const statusLines = doc.splitTextToSize(statusDesc, pageWidth - 40);
    doc.text(statusLines, pageWidth / 2, yPosition, { align: "center" });
    yPosition += statusLines.length * 5 + 10;

    // Trend Analysis Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Trend Analysis", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(result.trend, 20, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    const trendDesc = getTrendDescription(result.trend);
    const trendLines = doc.splitTextToSize(trendDesc, pageWidth - 40);
    doc.text(trendLines, 20, yPosition);
    yPosition += trendLines.length * 5 + 10;

    // Recommendation Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recommendation", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const recLines = doc.splitTextToSize(result.recommendation, pageWidth - 40);
    doc.text(recLines, 20, yPosition);
    yPosition += recLines.length * 5 + 8;
    doc.setFont("helvetica", "italic");
    doc.text(`Confidence: ${result.confidence}`, 20, yPosition);
    yPosition += 12;

    // Technical Details Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Technical Details", 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const technicalData = [
      { label: "ML Raw Score:", value: result.ml_raw_score.toFixed(4) },
      { label: "Final Score:", value: result.gemini_final_score.toFixed(4) },
      { label: "Oil Hours:", value: `${result.input_data.oil_hrs} hrs` },
      { label: "Total Hours:", value: `${result.input_data.total_hrs} hrs` },
      { label: "Viscosity @40°C:", value: `${result.input_data.viscosity_40} cSt` },
      { label: "Timestamp:", value: new Date(result.timestamp).toLocaleString() },
    ];

    technicalData.forEach((item) => {
      doc.setFont("helvetica", "bold");
      doc.text(item.label, 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(item.value, 80, yPosition);
      yPosition += 6;
    });

    // Save the PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    doc.save(`Engine-Health-Analysis-${timestamp}.pdf`);
  };


  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h2 className="text-3xl font-bold text-gray-800">Engine Health Analysis</h2>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
              title="Download PDF Report"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Health Score Gauge */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                stroke={getScoreColor(result.gemini_final_score)}
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 80 * result.gemini_final_score} ${2 * Math.PI * 80}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-4xl font-bold text-gray-800">{scorePercentage}</div>
              <div className="text-sm text-gray-500">Health Score</div>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`inline-block px-6 py-3 rounded-full text-lg font-semibold ${statusColor}`}>
            {result.status.replace(/_/g, " ")}
          </div>

          {/* Status Description */}
          <p className="mt-4 text-gray-600">
            {STATUS_DESCRIPTIONS[result.status]}
          </p>
        </div>
      </div>

      {/* Trend & Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Trend Analysis</h3>
          <div className="flex items-center">
            <TrendIcon trend={result.trend} />
            <span className="ml-3 text-xl font-medium text-gray-700">
              {result.trend}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {getTrendDescription(result.trend)}
          </p>
        </div>

        {/* Recommendation Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Recommendation</h3>
          <p className="text-gray-700">{result.recommendation}</p>
          <p className="mt-2 text-xs text-gray-500">
            Confidence: <span className="font-semibold">{result.confidence}</span>
          </p>
        </div>
      </div>

      {/* Technical Details */}
      <details className="bg-white rounded-lg shadow-md p-6">
        <summary className="cursor-pointer text-lg font-semibold text-gray-800 hover:text-blue-600">
          Technical Details
        </summary>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">ML Raw Score:</span> {result.ml_raw_score.toFixed(4)}
            </div>
            <div>
              <span className="font-medium">Final Score:</span> {result.gemini_final_score.toFixed(4)}
            </div>
            <div>
              <span className="font-medium">Oil Hours:</span> {result.input_data.oil_hrs} hrs
            </div>
            <div>
              <span className="font-medium">Total Hours:</span> {result.input_data.total_hrs} hrs
            </div>
            <div>
              <span className="font-medium">Viscosity @40°C:</span> {result.input_data.viscosity_40} cSt
            </div>
            <div>
              <span className="font-medium">Timestamp:</span> {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score < 0.25) return "#10b981"; // Green
  if (score < 0.40) return "#3b82f6"; // Blue
  if (score < 0.55) return "#f59e0b"; // Yellow
  if (score < 0.75) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "IMPROVING") {
    return (
      <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    );
  }
  if (trend === "DEGRADING") {
    return (
      <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );
}

function getTrendDescription(trend: string): string {
  switch (trend) {
    case "IMPROVING":
      return "Engine health has been improving over recent readings";
    case "DEGRADING":
      return "Engine health has been declining over recent readings";
    case "STABLE":
      return "Engine health remains consistent with historical patterns";
    default:
      return "";
  }
}
