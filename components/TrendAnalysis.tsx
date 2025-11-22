"use client";

import { useState, useMemo } from "react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { HistoricalDataPoint } from "@/lib/types";

interface TrendAnalysisProps {
    data: HistoricalDataPoint[];
}

type MetricKey =
    | "gemini_final_score"
    | "ml_raw_score"
    | "viscosity_40"
    | "viscosity_100"
    | "viscosity_index"
    | "fe_ppm"
    | "cr_ppm"
    | "pb_ppm"
    | "cu_ppm"
    | "sn_ppm"
    | "ni_ppm"
    | "al_ppm"
    | "si_ppm";

const METRICS: { key: MetricKey; label: string; color: string; unit: string; group: string }[] = [
    // Scores
    {
        key: "gemini_final_score",
        label: "Health Score",
        color: "#2563eb", // blue-600
        unit: "%",
        group: "Scores",
    },
    {
        key: "ml_raw_score",
        label: "ML Raw Prediction",
        color: "#9333ea", // purple-600
        unit: "%",
        group: "Scores",
    },
    // Viscosity
    {
        key: "viscosity_40",
        label: "Viscosity @ 40°C",
        color: "#0891b2", // cyan-600
        unit: "cSt",
        group: "Viscosity",
    },
    {
        key: "viscosity_100",
        label: "Viscosity @ 100°C",
        color: "#06b6d4", // cyan-500
        unit: "cSt",
        group: "Viscosity",
    },
    {
        key: "viscosity_index",
        label: "Viscosity Index",
        color: "#22d3ee", // cyan-400
        unit: "",
        group: "Viscosity",
    },
    // Wear Metals
    {
        key: "fe_ppm",
        label: "Iron (Fe)",
        color: "#ea580c", // orange-600
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "cr_ppm",
        label: "Chromium (Cr)",
        color: "#d97706", // amber-600
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "pb_ppm",
        label: "Lead (Pb)",
        color: "#ca8a04", // yellow-600
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "cu_ppm",
        label: "Copper (Cu)",
        color: "#b45309", // amber-700
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "sn_ppm",
        label: "Tin (Sn)",
        color: "#a16207", // yellow-700
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "ni_ppm",
        label: "Nickel (Ni)",
        color: "#854d0e", // yellow-800
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "al_ppm",
        label: "Aluminum (Al)",
        color: "#713f12", // yellow-900
        unit: "ppm",
        group: "Metals",
    },
    {
        key: "si_ppm",
        label: "Silicon (Si)",
        color: "#78350f", // amber-900
        unit: "ppm",
        group: "Metals",
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
                // Use ID for X-axis as requested
                xLabel: point.id,
                // Normalize scores to 0-100 for display if needed, or keep raw
                gemini_final_score: point.gemini_final_score * 100,
                ml_raw_score: point.ml_raw_score * 100,
            }));
    }, [data]);

    const currentMetric = METRICS.find((m) => m.key === selectedMetric)!;

    // Group metrics for display
    const metricGroups = METRICS.reduce((groups, metric) => {
        if (!groups[metric.group]) {
            groups[metric.group] = [];
        }
        groups[metric.group].push(metric);
        return groups;
    }, {} as Record<string, typeof METRICS>);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col mb-6 gap-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Trend Analysis</h2>
                    <p className="text-sm text-gray-500">
                        Monitor key engine health indicators over time
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {Object.entries(metricGroups).map(([groupName, metrics]) => (
                        <div key={groupName} className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 w-16 uppercase">{groupName}</span>
                            {metrics.map((metric) => (
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
                            dataKey="xLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#6b7280", fontSize: 12 }}
                            dy={10}
                            label={{ value: 'Record ID', position: 'insideBottomRight', offset: -5, fontSize: 12, fill: '#9ca3af' }}
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
                            labelFormatter={(label) => `Record ID: ${label}`}
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
