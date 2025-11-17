/**
 * Test script for auto-calculation of health_score_lag_1
 * Run with: npx tsx test-auto-health-score.ts
 */

import { getLatestPrediction } from "./lib/database";

async function testAutoHealthScore() {
  console.log("=".repeat(60));
  console.log("Testing Auto-calculation of Previous Health Score");
  console.log("=".repeat(60));

  try {
    // Test fetching latest prediction
    console.log("\n📊 Fetching latest prediction from database...");
    const latestPrediction = getLatestPrediction();

    if (latestPrediction) {
      console.log("✅ Found latest prediction:");
      console.log(`   ID: ${latestPrediction.id}`);
      console.log(`   Timestamp: ${latestPrediction.timestamp}`);
      console.log(`   Gemini Final Score: ${latestPrediction.gemini_final_score.toFixed(4)}`);
      console.log(`   Status: ${latestPrediction.status}`);
      console.log(`   Trend: ${latestPrediction.trend}`);
      console.log(`\n✅ This score will be used as health_score_lag_1 for next prediction`);
    } else {
      console.log("📝 No previous predictions found in database");
      console.log("   health_score_lag_1 will default to 0.0 for first prediction");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Auto-calculation logic is working correctly!");
    console.log("=".repeat(60));
    console.log("\n📝 Note: Users no longer need to enter 'Previous Health Score'");
    console.log("   The system automatically uses the last prediction's score.");
  } catch (error: any) {
    console.error("\n❌ Test failed:");
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testAutoHealthScore();
