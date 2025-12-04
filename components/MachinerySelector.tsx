"use client";

import { useState, useEffect } from "react";
import {
    SHIPS,
    MACHINERY_TYPES,
    MODELS,
    DEFAULT_SELECTION,
    MachinerySelection,
} from "@/lib/machinery-config";
import {
    loadSeedData,
    saveSelection,
    loadSelection,
} from "@/lib/seed-data-loader";
import { reloadSeedData } from "@/lib/memory-storage";

interface MachinerySelectorProps {
    onSelectionChange?: (selection: MachinerySelection) => void;
    onLoadingChange?: (loading: boolean) => void;
}

export default function MachinerySelector({
    onSelectionChange,
    onLoadingChange,
}: MachinerySelectorProps) {
    const [ship, setShip] = useState("");
    const [machineryType, setMachineryType] = useState("");
    const [model, setModel] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    // Load saved selection or use default on mount
    useEffect(() => {
        const saved = loadSelection();
        const initial = saved || DEFAULT_SELECTION;

        setShip(initial.ship);
        setMachineryType(initial.machineryType);
        setModel(initial.model);
        setInitialized(true);

        // Auto-load initial data
        loadData(initial.ship, initial.machineryType, initial.model);
    }, []);

    // Auto-load data when all selections are made
    useEffect(() => {
        if (initialized && ship && machineryType && model) {
            loadData(ship, machineryType, model);
        }
    }, [ship, machineryType, model, initialized]);

    const loadData = async (
        selectedShip: string,
        selectedMachinery: string,
        selectedModel: string
    ) => {
        setLoading(true);
        setError(null);
        onLoadingChange?.(true);

        try {
            const data = await loadSeedData(
                selectedShip,
                selectedMachinery,
                selectedModel
            );

            const selection: MachinerySelection = {
                ship: selectedShip,
                machineryType: selectedMachinery,
                model: selectedModel,
            };

            await reloadSeedData(data, selection);
            saveSelection(selection);
            onSelectionChange?.(selection);
        } catch (err) {
            const errorMsg =
                err instanceof Error ? err.message : "Failed to load seed data";
            setError(errorMsg);
            console.error("Error loading seed data:", err);
        } finally {
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    const handleShipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newShip = e.target.value;
        setShip(newShip);
        // Reset dependent selections
        setMachineryType("");
        setModel("");
    };

    const handleMachineryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMachinery = e.target.value;
        setMachineryType(newMachinery);
        // Reset dependent selection
        setModel("");
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setModel(e.target.value);
    };

    const getModelOptions = () => {
        if (!machineryType) return [];
        return MODELS[machineryType] || [];
    };

    const shipLabel = SHIPS.find((s) => s.id === ship)?.label || "";
    const machineryLabel =
        MACHINERY_TYPES.find((m) => m.id === machineryType)?.label || "";
    const modelLabel = getModelOptions().find((m) => m.id === model)?.label || "";
    const serialNumber = getModelOptions().find((m) => m.id === model)?.serialNumber || "";


    return (
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Machinery
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ship Selector */}
                <div>
                    <label
                        htmlFor="ship"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Ship / Craft
                    </label>
                    <select
                        id="ship"
                        value={ship}
                        onChange={handleShipChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                        <option value="">Select Ship</option>
                        {SHIPS.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Machinery Type Selector */}
                <div>
                    <label
                        htmlFor="machineryType"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Machinery Type
                    </label>
                    <select
                        id="machineryType"
                        value={machineryType}
                        onChange={handleMachineryChange}
                        disabled={!ship}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                    >
                        <option value="">Select Machinery</option>
                        {MACHINERY_TYPES.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Model Selector */}
                <div>
                    <label
                        htmlFor="model"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Make / Model
                    </label>
                    <select
                        id="model"
                        value={model}
                        onChange={handleModelChange}
                        disabled={!machineryType}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-black"
                    >
                        <option value="">Select Model</option>
                        {getModelOptions().map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status Messages */}
            {loading && (
                <div className="mt-4 flex items-center text-blue-600">
                    <svg
                        className="animate-spin h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <span className="text-sm">Loading seed data...</span>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                    {error}
                </div>
            )}

            {!loading && !error && ship && machineryType && model && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                        <span className="font-semibold">Currently Viewing:</span>{" "}
                        {shipLabel} - {machineryLabel} ({modelLabel})
                    </p>
                    {serialNumber && (
                        <p className="text-sm text-green-700 mt-1">
                            <span className="font-semibold">Serial Number:</span>{" "}
                            {serialNumber}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
