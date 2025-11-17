"use client";

import { HistoricalDataPoint, STATUS_COLORS } from "@/lib/types";

interface HistoryTableProps {
  data: HistoricalDataPoint[];
}

export default function HistoryTable({ data }: HistoryTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No historical data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Health Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oil Hrs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Hrs
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(row.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="w-16 h-2 rounded-full mr-2"
                      style={{
                        background: `linear-gradient(to right, #10b981 ${(1 - row.gemini_final_score) * 100}%, #ef4444 ${row.gemini_final_score * 100}%)`,
                      }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {(row.gemini_final_score * 100).toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[row.status]}`}>
                    {row.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <TrendBadge trend={row.trend} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.oil_hrs.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.total_hrs.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: string }) {
  const colors = {
    IMPROVING: "text-green-600",
    STABLE: "text-blue-600",
    DEGRADING: "text-red-600",
  };

  const icons = {
    IMPROVING: "↗",
    STABLE: "→",
    DEGRADING: "↘",
  };

  return (
    <span className={`font-medium ${colors[trend as keyof typeof colors]}`}>
      {icons[trend as keyof typeof icons]} {trend}
    </span>
  );
}
