/**
 * Simplified Prediction API Route
 * Direct Gemini API call - no ONNX, no Postgres, just simple file storage!
 */

import { NextRequest, NextResponse } from "next/server";
import { ShipDataInput, PredictionResult } from "@/lib/types";
import { getLatestPrediction, insertPrediction, getHistoricalData } from "@/lib/simple-storage";
import { predictWithGemini } from "@/lib/simple-gemini";

// Force Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse input data
    const inputData: ShipDataInput = await request.json();

    // Auto-calculate health_score_lag_1 from history
    const latestPrediction = await getLatestPrediction();
    if (latestPrediction) {
      inputData.health_score_lag_1 = latestPrediction.gemini_final_score;
      console.log(`📊 Using previous health score: ${inputData.health_score_lag_1.toFixed(4)}`);
    } else {
      inputData.health_score_lag_1 = 0;
      console.log("📊 First prediction, using default health score: 0.0");
    }

    // Validate input
    const validation = validateInput(inputData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log("🚀 Starting simplified prediction pipeline...");

    // Get historical data for context
    const historicalData = await getHistoricalData(60);
    console.log(`📚 Retrieved ${historicalData.length} historical records`);

    // Call Gemini directly (no ML model needed!)
    console.log("🧠 Calling Gemini AI for prediction...");
    const prediction = await predictWithGemini(inputData, historicalData);

    console.log(`✅ Prediction complete!`);
    console.log(`   ML Score (simulated): ${prediction.ml_raw_score.toFixed(4)}`);
    console.log(`   Final Score: ${prediction.gemini_final_score.toFixed(4)}`);
    console.log(`   Status: ${prediction.status}`);

    // Store result in file
    console.log("💾 Saving to file storage...");
    const recordId = await insertPrediction({
      input: inputData,
      ml_raw_score: prediction.ml_raw_score,
      gemini_final_score: prediction.gemini_final_score,
      status: prediction.status,
      trend: prediction.trend,
      recommendation: prediction.recommendation,
      confidence: prediction.confidence,
    });
    console.log(`✅ Saved with ID: ${recordId}`);

    // Return result
    const result: PredictionResult = {
      id: recordId,
      timestamp: new Date().toISOString(),
      input_data: inputData,
      ml_raw_score: prediction.ml_raw_score,
      gemini_final_score: prediction.gemini_final_score,
      status: prediction.status,
      trend: prediction.trend,
      recommendation: prediction.recommendation,
      confidence: prediction.confidence,
    };

    console.log("✅ Pipeline completed successfully\n");

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("❌ Prediction error:", error);

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

  // health_score_lag_1 is auto-calculated, just validate
  if (
    typeof data.health_score_lag_1 !== "number" ||
    data.health_score_lag_1 < 0 ||
    data.health_score_lag_1 > 1
  ) {
    return { valid: false, error: "Invalid health_score_lag_1: must be between 0 and 1" };
  }

  return { valid: true };
}
