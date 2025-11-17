/**
 * Main Prediction API Route
 * Orchestrates: ML Model (ONNX) → Historical Data → Gemini → Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { ShipDataInput, PredictionResult } from "@/lib/types";
import { getHistoricalData, insertPrediction, getLatestPrediction } from "@/lib/database";
import { analyzeShipHealth } from "@/lib/gemini";
import { predictHealthScore } from "@/lib/onnx-predictor";

// Force Node.js runtime for ONNX compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse input data
    const inputData: ShipDataInput = await request.json();

    // Auto-calculate health_score_lag_1 from database history
    const latestPrediction = await getLatestPrediction();
    if (latestPrediction) {
      inputData.health_score_lag_1 = latestPrediction.gemini_final_score;
      console.log(`📊 Using previous health score from history: ${inputData.health_score_lag_1.toFixed(4)}`);
    } else {
      inputData.health_score_lag_1 = 0;
      console.log("📊 No history found, using default health score: 0.0 (first prediction)");
    }

    // Validate input
    const validation = validateInput(inputData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log("📊 Starting prediction pipeline...");

    // Step 1: Call ONNX ML Model (no Python required!)
    // console.log("🤖 Calling ONNX ML model...");
    // const mlResponse = await predictHealthScore(inputData);

    const mlRawScore = 0.1
    const confidence = "0.1"
    // console.log(`✅ ML Score: ${mlRawScore.toFixed(4)} (ONNX Runtime)`);

    // Step 2: Fetch Historical Data
    console.log("📚 Fetching historical data...");
    const historicalData = await getHistoricalData(60);
    console.log(`✅ Retrieved ${historicalData.length} historical records`);

    // Step 3: Send to Gemini for Analysis
    console.log("🧠 Analyzing with Gemini AI...");
    const geminiAnalysis = await analyzeShipHealth(
      mlRawScore,
      inputData,
      historicalData
    );
    console.log(`✅ Gemini Analysis: ${geminiAnalysis.status}, Score: ${geminiAnalysis.final_score.toFixed(4)}`);

    // Step 4: Store Result in Database
    console.log("💾 Storing result in database...");
    const recordId = await insertPrediction({
      input: inputData,
      ml_raw_score: mlRawScore,
      gemini_final_score: geminiAnalysis.final_score,
      status: geminiAnalysis.status,
      trend: geminiAnalysis.trend,
      recommendation: geminiAnalysis.recommendation,
      confidence: confidence,
    });
    console.log(`✅ Record saved with ID: ${recordId}`);

    // Step 5: Return Complete Result
    const result: PredictionResult = {
      id: recordId,
      timestamp: new Date().toISOString(),
      input_data: inputData,
      ml_raw_score: mlRawScore,
      gemini_final_score: geminiAnalysis.final_score,
      status: geminiAnalysis.status,
      trend: geminiAnalysis.trend,
      recommendation: geminiAnalysis.recommendation,
      confidence: confidence,
    };

    console.log("✅ Prediction pipeline completed successfully");

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("❌ Prediction pipeline error:", error);

    // Handle ONNX model errors
    if (error.message?.includes("ONNX prediction failed")) {
      return NextResponse.json(
        { error: "ONNX model inference failed. Please check the model file." },
        { status: 503 }
      );
    }

    if (error.message?.includes("Failed to load ONNX model")) {
      return NextResponse.json(
        { error: "ML model file not found. Please ensure the ONNX model is in python-backend/models/" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Prediction failed" },
      { status: 500 }
    );
  }
}

/**
 * Validate input data
 */
function validateInput(data: ShipDataInput): { valid: boolean; error?: string } {
  if (typeof data.oil_hrs !== "number" || data.oil_hrs < 0) {
    return { valid: false, error: "Invalid oil_hrs: must be a positive number" };
  }

  if (typeof data.total_hrs !== "number" || data.total_hrs < 0) {
    return { valid: false, error: "Invalid total_hrs: must be a positive number" };
  }

  if (typeof data.viscosity_40 !== "number" || data.viscosity_40 <= 0) {
    return { valid: false, error: "Invalid viscosity_40: must be a positive number" };
  }

  if (![0, 1].includes(data.oil_refill_start)) {
    return { valid: false, error: "Invalid oil_refill_start: must be 0 or 1" };
  }

  if (![0, 1].includes(data.oil_topup)) {
    return { valid: false, error: "Invalid oil_topup: must be 0 or 1" };
  }

  // health_score_lag_1 is auto-calculated from history, so we just validate it exists and is valid
  if (
    typeof data.health_score_lag_1 !== "number" ||
    data.health_score_lag_1 < 0 ||
    data.health_score_lag_1 > 1
  ) {
    return { valid: false, error: "Invalid health_score_lag_1: must be between 0 and 1" };
  }

  return { valid: true };
}
