/**
 * Quick test script for ONNX model inference
 * Run with: npx tsx test-onnx.ts
 */

import { predictHealthScore, getModelInfo } from "./lib/onnx-predictor";
import { ShipDataInput } from "./lib/types";

async function testONNXModel() {
  console.log("=".repeat(60));
  console.log("ONNX Model Test");
  console.log("=".repeat(60));

  try {
    // Test 1: Get model info
    console.log("\n📊 Getting model information...");
    const modelInfo = await getModelInfo();
    console.log("✅ Model Info:");
    console.log(`   Type: ${modelInfo.model_type}`);
    console.log(`   Features: ${modelInfo.features.join(", ")}`);
    console.log(`   Feature count: ${modelInfo.feature_count}`);
    console.log(`   Output range: ${modelInfo.output_range}`);
    console.log(`   Runtime: ${modelInfo.runtime}`);

    // Test 2: Make a prediction with example data
    console.log("\n🧪 Testing prediction with example data...");
    const testInput: ShipDataInput = {
      oil_hrs: 3500,
      total_hrs: 98000,
      viscosity_40: 140,
      oil_refill_start: 0,
      oil_topup: 1,
      health_score_lag_1: 0.35,
    };

    console.log("   Input data:");
    console.log(`     Oil Hours: ${testInput.oil_hrs}`);
    console.log(`     Total Hours: ${testInput.total_hrs}`);
    console.log(`     Viscosity @40°C: ${testInput.viscosity_40}`);
    console.log(`     Oil Refill: ${testInput.oil_refill_start}`);
    console.log(`     Oil Top-up: ${testInput.oil_topup}`);
    console.log(`     Previous Health Score: ${testInput.health_score_lag_1}`);

    const prediction = await predictHealthScore(testInput);

    console.log("\n✅ Prediction Result:");
    console.log(`   Raw Health Score: ${prediction.raw_health_score.toFixed(4)}`);
    console.log(`   Confidence: ${prediction.confidence}`);
    console.log(`   Model Version: ${prediction.model_version}`);

    // Test 3: Health status interpretation
    const score = prediction.raw_health_score;
    let status = "";
    if (score < 0.25) status = "🟢 OPTIMAL_CONDITION";
    else if (score < 0.40) status = "🟡 NORMAL_WEAR";
    else if (score < 0.55) status = "🟠 ATTENTION_REQUIRED";
    else if (score < 0.75) status = "🔴 MAINTENANCE_DUE";
    else status = "⛔ CRITICAL_ALERT";

    console.log(`   Predicted Status: ${status}`);

    // Test 4: Performance test
    console.log("\n⚡ Performance test (10 predictions)...");
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await predictHealthScore(testInput);
    }
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 10;
    console.log(`✅ Average prediction time: ${avgTime.toFixed(2)}ms`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests passed!");
    console.log("=".repeat(60));
    console.log("\n🚀 ONNX model is working correctly!");
    console.log("   Your Next.js app can now run without Python dependencies.");
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testONNXModel();
