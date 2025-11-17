/**
 * Test Gemini API Integration
 * Run with: npx tsx test-gemini.ts
 */

import { analyzeShipHealth } from "./lib/gemini";
import { ShipDataInput, HistoricalDataPoint } from "./lib/types";

async function testGeminiAPI() {
  console.log("=".repeat(60));
  console.log("Testing Gemini API Integration");
  console.log("=".repeat(60));

  // Check environment variable
  console.log("\n🔑 Checking Gemini API Key...");
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyBQ6zopKRlpG9TWA7S09GgRpa7pK9ibRYQ";

  if (!apiKey) {
    console.log("❌ GEMINI_API_KEY not found in environment");
    console.log("   Please set it in .env.local file");
    process.exit(1);
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log(`   Length: ${apiKey.length} characters`);

  // Test data
  const testInput: ShipDataInput = {
    oil_hrs: 3500,
    total_hrs: 98000,
    viscosity_40: 140,
    oil_refill_start: 0,
    oil_topup: 1,
    health_score_lag_1: 0.35,
    fe_ppm: 45,
    pb_ppm: 8,
    cu_ppm: 12,
    al_ppm: 5,
    si_ppm: 10,
  };

  // Mock historical data
  const mockHistory: HistoricalDataPoint[] = [
    {
      id: 1,
      timestamp: "2025-11-01T10:00:00Z",
      oil_hrs: 3000,
      total_hrs: 97000,
      viscosity_40: 138,
      oil_refill_start: 0,
      oil_topup: 0,
      health_score_lag_1: 0.30,
      fe_ppm: 40,
      pb_ppm: 7,
      cu_ppm: 10,
      al_ppm: 4,
      si_ppm: 8,
      ml_raw_score: 0.32,
      gemini_final_score: 0.30,
      status: "NORMAL_WEAR",
      trend: "STABLE",
      recommendation: "Continue monitoring",
    },
    {
      id: 2,
      timestamp: "2025-11-10T10:00:00Z",
      oil_hrs: 3200,
      total_hrs: 97500,
      viscosity_40: 139,
      oil_refill_start: 0,
      oil_topup: 0,
      health_score_lag_1: 0.30,
      fe_ppm: 42,
      pb_ppm: 7,
      cu_ppm: 11,
      al_ppm: 4,
      si_ppm: 9,
      ml_raw_score: 0.35,
      gemini_final_score: 0.33,
      status: "NORMAL_WEAR",
      trend: "STABLE",
      recommendation: "Continue monitoring",
    },
  ];

  const mlRawScore = 0.2425;

  try {
    console.log("\n🧠 Calling Gemini API...");
    console.log(`   ML Raw Score: ${mlRawScore.toFixed(4)}`);
    console.log(`   Input Data: Oil Hrs=${testInput.oil_hrs}, Total Hrs=${testInput.total_hrs}`);
    console.log(`   Historical Records: ${mockHistory.length}`);

    const startTime = Date.now();
    const result = await analyzeShipHealth(mlRawScore, testInput, mockHistory);
    const endTime = Date.now();

    console.log(`\n✅ Gemini API Response Received (${endTime - startTime}ms)`);
    console.log("─".repeat(60));
    console.log(`   Final Score: ${result.final_score.toFixed(4)}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Trend: ${result.trend}`);
    console.log(`   Recommendation: "${result.recommendation}"`);
    console.log("─".repeat(60));

    // Check if it's using fallback
    if (result.recommendation.includes("Gemini analysis unavailable")) {
      console.log("\n⚠️  WARNING: Using fallback system (Gemini API failed)");
      console.log("   This means the API call didn't work properly");
      console.log("\n🔍 Possible issues:");
      console.log("   1. Invalid API key");
      console.log("   2. API quota exceeded");
      console.log("   3. Network connectivity issue");
      console.log("   4. Gemini service down");
    } else {
      console.log("\n🎉 SUCCESS: Gemini API is working correctly!");
      console.log("   The AI provided a custom recommendation");

      // Verify the score was adjusted from ML
      if (Math.abs(result.final_score - mlRawScore) > 0.001) {
        console.log(`\n✅ Score Adjustment: ML=${mlRawScore.toFixed(4)} → Gemini=${result.final_score.toFixed(4)}`);
        console.log("   Gemini considered context and adjusted the score");
      } else {
        console.log(`\n📊 Score Maintained: ${mlRawScore.toFixed(4)}`);
        console.log("   Gemini agreed with ML prediction");
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Gemini Integration Test Complete");
    console.log("=".repeat(60));

  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(`   Error: ${error.message}`);

    if (error.message.includes("API key")) {
      console.error("\n💡 Tip: Check your GEMINI_API_KEY in .env.local");
      console.error("   Get a key from: https://aistudio.google.com/app/apikey");
    } else if (error.message.includes("quota")) {
      console.error("\n💡 Tip: You may have exceeded your Gemini API quota");
      console.error("   Check your usage at: https://aistudio.google.com/");
    }

    process.exit(1);
  }
}

// Run test
testGeminiAPI();
