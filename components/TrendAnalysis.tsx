"use client";

import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart,
} from "recharts";
import { HistoricalDataPoint } from "@/lib/types";

interface TrendAnalysisProps {
    data: HistoricalDataPoint[];
}

type MetricKey =
    | "viscosity_40"
    | "fe_ppm"
    | "gemini_final_score"
    | "ml_raw_score";

const METRICS: { key: MetricKey; label: string; color: string; unit: string }[] = [
    {
        key: "gemini_final_score",
        label: "Health Score",
        color: "#2563eb", // blue-600
        unit: "%",
    },
    {
        key: "viscosity_40",
        label: "Viscosity @ 40°C",
        color: "#0891b2", // cyan-600
        unit: "cSt",
    },
    {
        key: "fe_ppm",
        label: "Iron Content",
        color: "#ea580c", // orange-600
        unit: "ppm",
    },
    {
        key: "ml_raw_score",
        label: "ML Raw Prediction",
        color: "#9333ea", // purple-600
        unit: "%",
    },
];

export default function TrendAnalysis({ data }: TrendAnalysisProps) {
    const [selectedMetric, setSelectedMetric] = useState<MetricKey>(
        "gemini_final_score"
    );

    // Process data for chart
    const chartData = useMemo(() => {
        // Sort by date ascending for the chart
        return [...data]
            .sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            .map((point) => ({
                ...point,
                formattedDate: new Date(point.timestamp).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                }),
                // Normalize scores to 0-100 for display if needed, or keep raw
                gemini_final_score: point.gemini_final_score * 100,
                ml_raw_score: point.ml_raw_score * 100,
            }));
    }, [data]);

    const currentMetric = METRICS.find((m) => m.key === selectedMetric)!;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Trend Analysis</h2>
                    <p className="text-sm text-gray-500">
                        Monitor key engine health indicators over time
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {METRICS.map((metric) => (
                        <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric.key)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedMetric === metric.key
                                    ? "bg-gray-900 text-white shadow-md"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {metric.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id={`color-${selectedMetric}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor={currentMetric.color}
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="95%"
                                    stopColor={currentMetric.color}
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="formattedDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            domain={["auto", "auto"]}
                            unit={currentMetric.unit === "%" ? "" : ` ${currentMetric.unit}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                            itemStyle={{ color: currentMetric.color, fontWeight: 600 }}
                            formatter={(value: number) => [
                                `${value.toFixed(2)} ${currentMetric.unit}`,
                                currentMetric.label,
                            ]}
                            labelStyle={{ color: "#374151", marginBottom: "0.5rem" }}
                        />
                        <Area
                            type="monotone"
                            dataKey={selectedMetric}
                            stroke={currentMetric.color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#color-${selectedMetric})`}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
