"use client";

import { useState } from "react";
import { ShipDataInput, PredictionResult } from "@/lib/types";

interface PredictionFormProps {
  onResult: (result: PredictionResult) => void;
  disabled?: boolean;
}

export default function PredictionForm({ onResult, disabled = false }: PredictionFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveData, setSaveData] = useState(false);

  const [formData, setFormData] = useState<ShipDataInput>({
    oil_hrs: 3500,
    total_hrs: 98000,
    viscosity_40: 140,
    viscosity_100: undefined,
    viscosity_index: undefined,
    oil_refill_start: 0,
    oil_topup: 0,
    health_score_lag_1: 0, // Will be auto-calculated from history
    fe_ppm: undefined,
    pb_ppm: undefined,
    cu_ppm: undefined,
    al_ppm: undefined,
    si_ppm: undefined,
    cr_ppm: undefined,
    sn_ppm: undefined,
    ni_ppm: undefined,
    tbn: undefined,
    water_content: undefined,
    flash_point: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, saveData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const result: PredictionResult = await response.json();
      onResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ShipDataInput, value: string) => {
    // For optional fields, allow undefined
    if (value === "") {
      setFormData((prev) => ({ ...prev, [field]: undefined }));
    } else if (field === "water_content") {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      const numValue = parseFloat(value);
      setFormData((prev) => ({ ...prev, [field]: isNaN(numValue) ? undefined : numValue }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Engine Data Input
        </h2>

        {/* Core Metrics */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
            Core Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Oil Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.oil_hrs || ""}
                onChange={(e) => handleChange("oil_hrs", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="Hours since last oil change"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Engine Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.total_hrs || ""}
                onChange={(e) => handleChange("total_hrs", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="Total operating hours"
              />
            </div>
          </div>
        </div>

        {/* Viscosity Metrics */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
            Viscosity Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viscosity @40°C (cSt) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.viscosity_40 || ""}
                onChange={(e) => handleChange("viscosity_40", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="cSt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viscosity @100°C (cSt)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.viscosity_100 || ""}
                onChange={(e) => handleChange("viscosity_100", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="cSt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viscosity Index
              </label>
              <input
                type="number"
                step="1"
                value={formData.viscosity_index || ""}
                onChange={(e) => handleChange("viscosity_index", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="Index"
              />
            </div>
          </div>
        </div>

        {/* Wear Metal Concentrations */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
            Wear Metal Concentrations (ppm)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Iron (Fe)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.fe_ppm || ""}
                onChange={(e) => handleChange("fe_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chromium (Cr)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.cr_ppm || ""}
                onChange={(e) => handleChange("cr_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead (Pb)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.pb_ppm || ""}
                onChange={(e) => handleChange("pb_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Copper (Cu)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.cu_ppm || ""}
                onChange={(e) => handleChange("cu_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tin (Sn)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.sn_ppm || ""}
                onChange={(e) => handleChange("sn_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aluminum (Al)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.al_ppm || ""}
                onChange={(e) => handleChange("al_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nickel (Ni)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.ni_ppm || ""}
                onChange={(e) => handleChange("ni_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Silicon (Si)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.si_ppm || ""}
                onChange={(e) => handleChange("si_ppm", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="ppm"
              />
            </div>
          </div>
        </div>

        {/* Other Properties */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3 border-b pb-2">
            Other Properties
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                TBN (mg KOH/g)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.tbn || ""}
                onChange={(e) => handleChange("tbn", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="TBN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Water Content (%)
              </label>
              <input
                type="text"
                value={formData.water_content || ""}
                onChange={(e) => handleChange("water_content", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="e.g. <0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flash Point (°C)
              </label>
              <input
                type="number"
                step="1"
                value={formData.flash_point || ""}
                onChange={(e) => handleChange("flash_point", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="°C"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Save Option */}
        <div className="flex items-center mt-4">
          <input
            id="save-data"
            type="checkbox"
            checked={saveData}
            onChange={(e) => setSaveData(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="save-data" className="ml-2 block text-sm text-gray-900">
            Save as next data point (adds to historical dataset)
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || disabled}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze Engine Health"}
        </button>
      </div>
    </form>
  );
}
