/**
 * ONNX Model Inference for Ship Health Prediction
 * Pure TypeScript/Node.js implementation - no Python required
 */

import * as ort from "onnxruntime-node";
import path from "path";
import { ShipDataInput } from "./types";

// Path to the ONNX model
const MODEL_PATH = path.join(
  process.cwd(),
  "models",
  "health_model.onnx"
);

// Feature columns expected by the model (must match training order)
const FEATURE_COLUMNS = [
  "Oil Hrs",
  "Total Hrs",
  "Visc @40°C",
  "Oil Refill Start",
  "Oil Top-up",
  "Health_Score_Lag_1",
];

// Singleton session for better performance
let sessionPromise: Promise<ort.InferenceSession> | null = null;

/**
 * Load the ONNX model session (cached)
 */
async function getSession(): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    console.log(`🔄 Loading ONNX model from: ${MODEL_PATH}`);
    sessionPromise = ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ["cpu"], // Use CPU provider for compatibility
      graphOptimizationLevel: "all",
    });

    sessionPromise
      .then(() => console.log("✅ ONNX model loaded successfully"))
      .catch((error) => {
        console.error("❌ Failed to load ONNX model:", error);
        sessionPromise = null; // Reset on error for retry
        throw error;
      });
  }
  return sessionPromise;
}

/**
 * Predict health score using ONNX model
 */
export async function predictHealthScore(inputData: ShipDataInput): Promise<{
  raw_health_score: number;
  confidence: string;
  model_version: string;
  features_used: string[];
}> {
  try {
    // Load the model session
    const session = await getSession();

    // Prepare input features in the correct order
    const features = new Float32Array([
      inputData.oil_hrs,
      inputData.total_hrs,
      inputData.viscosity_40,
      inputData.oil_refill_start,
      inputData.oil_topup,
      inputData.health_score_lag_1,
    ]);

    // Create input tensor [1, 6] (batch_size=1, features=6)
    const inputTensor = new ort.Tensor("float32", features, [1, 6]);

    // Get input name from model metadata
    const inputName = session.inputNames[0];

    // Run inference
    const outputs = await session.run({ [inputName]: inputTensor });

    // Extract prediction from output tensor
    const outputTensor = outputs[session.outputNames[0]];
    const prediction = outputTensor.data[0] as number;

    // Clamp prediction to valid range [0, 1]
    const clampedPrediction = Math.max(0, Math.min(1, prediction));

    // Determine confidence based on input quality
    let confidence = "high";
    if (inputData.health_score_lag_1 === 0) {
      confidence = "medium"; // No historical context
    }

    return {
      raw_health_score: clampedPrediction,
      confidence,
      model_version: "XGBoost_v1.0_ONNX",
      features_used: FEATURE_COLUMNS,
    };
  } catch (error: any) {
    console.error("❌ ONNX prediction error:", error);
    throw new Error(`ONNX prediction failed: ${error.message}`);
  }
}

/**
 * Get model information
 */
export async function getModelInfo(): Promise<{
  model_type: string;
  features: string[];
  feature_count: number;
  output_range: string;
  runtime: string;
}> {
  try {
    const session = await getSession();

    return {
      model_type: "XGBoost (ONNX Runtime)",
      features: FEATURE_COLUMNS,
      feature_count: FEATURE_COLUMNS.length,
      output_range: "0.0 (healthy) to 1.0 (critical failure)",
      runtime: "onnxruntime-node (no Python required)",
    };
  } catch (error: any) {
    throw new Error(`Failed to get model info: ${error.message}`);
  }
}

/**
 * Cleanup function (call on application shutdown)
 */
export async function cleanupModel(): Promise<void> {
  if (sessionPromise) {
    try {
      const session = await sessionPromise;
      await session.release();
      sessionPromise = null;
      console.log("✅ ONNX model session released");
    } catch (error) {
      console.error("⚠️  Error releasing ONNX session:", error);
    }
  }
}

/**
 * Warm up the model (preload for faster first prediction)
 */
export async function warmupModel(): Promise<void> {
  try {
    console.log("🔥 Warming up ONNX model...");
    await getSession();

    // Run a dummy prediction to warm up
    const dummyInput: ShipDataInput = {
      oil_hrs: 3500,
      total_hrs: 98000,
      viscosity_40: 140,
      oil_refill_start: 0,
      oil_topup: 0,
      health_score_lag_1: 0.35,
    };

    await predictHealthScore(dummyInput);
    console.log("✅ ONNX model warmed up and ready");
  } catch (error) {
    console.error("⚠️  Model warmup failed:", error);
  }
}
