/**
 * Simplified Prediction API Route
 * Direct Gemini API call - no ONNX, no Postgres, just simple file storage!
 */

import { NextRequest, NextResponse } from "next/server";
import { ShipDataInput, PredictionResult } from "@/lib/types";
import { getLatestPrediction, getLatestPredictionByShip, insertPrediction, getHistoricalData } from "@/lib/memory-storage";
import { predictWithGemini } from "@/lib/simple-gemini";
import fs from 'fs/promises';
import path from 'path';

// Force Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse input data
    const body = await request.json();
    const { saveData, ...inputDataRaw } = body;
    const inputData: ShipDataInput = inputDataRaw;

    // Auto-calculate health_score_lag_1 from history (ship-specific if ship is selected)
    let latestPrediction;
    if (inputData.ship_name && inputData.ship_name !== "ALL") {
      latestPrediction = await getLatestPredictionByShip(inputData.ship_name);
      console.log(`📊 Using previous health score for ${inputData.ship_name}: ${latestPrediction?.gemini_final_score?.toFixed(4) || "N/A"}`);
    } else {
      latestPrediction = await getLatestPrediction();
      console.log(`📊 Using previous health score (all ships): ${latestPrediction?.gemini_final_score?.toFixed(4) || "N/A"}`);
    }

    if (latestPrediction) {
      inputData.health_score_lag_1 = latestPrediction.gemini_final_score;
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

    // Save to persistent JSON file if requested
    if (saveData) {
      try {
        const filePath = path.join(process.cwd(), 'lib', 'seed-data-new.json');
        console.log(`📝 Persisting to ${filePath}...`);

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const currentData = JSON.parse(fileContent);

        const newRecord = {
          id: recordId,
          created_at: new Date().toISOString(),
          ...inputData,
          ml_raw_score: prediction.ml_raw_score,
          gemini_final_score: prediction.gemini_final_score,
          status: prediction.status,
          trend: prediction.trend,
          recommendation: prediction.recommendation,
          confidence: prediction.confidence
        };

        currentData.push(newRecord);
        await fs.writeFile(filePath, JSON.stringify(currentData, null, 2));
        console.log("✅ Successfully saved to persistent storage");
      } catch (fsError) {
        console.error("❌ Failed to save to persistent storage:", fsError);
        // Don't fail the request, just log the error
      }
    }

    // Return result
    const result: PredictionResult = {
      id: recordId,
      timestamp: new Date().toISOString(),
      ship_name: inputData.ship_name,
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
