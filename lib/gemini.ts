/**
 * Gemini API Integration for Ship Health Analysis
 * Uses structured output to ensure consistent predictions
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { GeminiAnalysis, HealthStatus, TrendDirection, HistoricalDataPoint, ShipDataInput } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Define the structured output schema for Gemini
const analysisSchema = {
  type: SchemaType.OBJECT,
  properties: {
    final_score: {
      type: SchemaType.NUMBER,
      description: "Final health score between 0.0 (healthy) and 1.0 (critical)",
      nullable: false,
    },
    status: {
      type: SchemaType.STRING,
      description: "Health status category",
      enum: [
        "OPTIMAL_CONDITION",
        "NORMAL_WEAR",
        "ATTENTION_REQUIRED",
        "MAINTENANCE_DUE",
        "CRITICAL_ALERT",
      ],
      nullable: false,
    },
    trend: {
      type: SchemaType.STRING,
      description: "Trend direction based on historical data",
      enum: ["IMPROVING", "STABLE", "DEGRADING"],
      nullable: false,
    },
    recommendation: {
      type: SchemaType.STRING,
      description: "Brief, professional maintenance recommendation (max 150 characters)",
      nullable: false,
    },
  },
  required: ["final_score", "status", "trend", "recommendation"],
};

/**
 * Analyze ship health using Gemini with historical context
 */
export async function analyzeShipHealth(
  mlRawScore: number,
  inputData: ShipDataInput,
  historicalData: HistoricalDataPoint[]
): Promise<GeminiAnalysis> {
  try {
    // Use Gemini 2.0 Flash (more stable, less load than 2.5)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Build context from historical data
    const historicalContext = buildHistoricalContext(historicalData);
    const trendAnalysis = analyzeTrend(historicalData);
    const maintenanceHistory = analyzeMaintenanceHistory(historicalData);

    // Build comprehensive prompt
    const prompt = `You are an expert marine engineer analyzing ship engine health for the SLNS Gajabahu No. 02 Generator.

## Current Situation
A machine learning model has predicted a raw health score of ${mlRawScore.toFixed(4)} (0.0 = healthy, 1.0 = critical failure).

## New Data Point
- Oil Hours: ${inputData.oil_hrs} hrs (hours since last oil change)
- Total Engine Hours: ${inputData.total_hrs} hrs
- Viscosity @40°C: ${inputData.viscosity_40} cSt
- Oil Refill: ${inputData.oil_refill_start === 1 ? "Yes" : "No"}
- Oil Top-up: ${inputData.oil_topup === 1 ? "Yes" : "No"}
- Previous Health Score: ${inputData.health_score_lag_1.toFixed(4)}
${inputData.fe_ppm ? `- Iron (Fe): ${inputData.fe_ppm} ppm` : ""}
${inputData.pb_ppm ? `- Lead (Pb): ${inputData.pb_ppm} ppm` : ""}
${inputData.cu_ppm ? `- Copper (Cu): ${inputData.cu_ppm} ppm` : ""}
${inputData.al_ppm ? `- Aluminum (Al): ${inputData.al_ppm} ppm` : ""}
${inputData.si_ppm ? `- Silicon (Si): ${inputData.si_ppm} ppm` : ""}

## Historical Context
${historicalContext}

## Trend Analysis
${trendAnalysis}

## Maintenance History
${maintenanceHistory}

## Your Task
Analyze this data comprehensively and provide:

1. **final_score**: Adjust the ML model's raw score based on:
   - Historical trend patterns
   - Maintenance events (oil changes reduce scores)
   - Wear metal concentrations if available
   - Viscosity changes
   - Rate of degradation
   - Your score can be higher or lower than the ML score based on context

2. **status**: Choose ONE category:
   - OPTIMAL_CONDITION: Score 0.0-0.25, all parameters normal
   - NORMAL_WEAR: Score 0.25-0.40, expected aging patterns
   - ATTENTION_REQUIRED: Score 0.40-0.55, elevated indicators
   - MAINTENANCE_DUE: Score 0.55-0.75, service needed soon
   - CRITICAL_ALERT: Score 0.75-1.0, immediate action required

3. **trend**:
   - IMPROVING: Health scores decreasing over time
   - STABLE: Consistent health scores
   - DEGRADING: Health scores increasing over time

4. **recommendation**: Professional, brief advice (max 150 chars). Must be actionable and specific.

## Critical Rules
- Your output MUST feel like a technical assessment, NOT a chat response
- Be precise and professional
- Recommendations must be actionable
- Consider the FULL context, not just the current reading
- If health is degrading rapidly, be more conservative in your assessment
- Recent oil changes should significantly improve the score

## Output Format
You MUST respond with ONLY valid JSON (no markdown, no code blocks, no explanations) in this exact format:
{
  "final_score": 0.25,
  "status": "NORMAL_WEAR",
  "trend": "STABLE",
  "recommendation": "Your recommendation here"
}

Provide your JSON analysis now.`;

    const result = await model.generateContent(prompt);
    let response = result.response.text();

    // Log the raw Gemini response
    console.log("\n" + "=".repeat(60));
    console.log("🧠 GEMINI AI RESPONSE");
    console.log("=".repeat(60));
    console.log(response);
    console.log("=".repeat(60) + "\n");

    // Clean up response - remove markdown code blocks if present
    response = response.trim();
    if (response.startsWith("```json")) {
      response = response.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (response.startsWith("```")) {
      response = response.replace(/```\n?/g, "");
    }
    response = response.trim();

    const analysis = JSON.parse(response) as GeminiAnalysis;

    // Log the parsed analysis
    console.log("📊 Parsed Gemini Analysis:");
    console.log(`   Final Score: ${analysis.final_score.toFixed(4)}`);
    console.log(`   Status: ${analysis.status}`);
    console.log(`   Trend: ${analysis.trend}`);
    console.log(`   Recommendation: "${analysis.recommendation}"`);
    console.log("");

    // Validate and clamp values
    analysis.final_score = Math.max(0, Math.min(1, analysis.final_score));

    return analysis;
  } catch (error: any) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ GEMINI API ERROR");
    console.error("=".repeat(60));
    console.error("Error:", error.message);
    console.error("Status:", error.status || "N/A");
    console.error("=".repeat(60) + "\n");

    // Fallback to rule-based system if Gemini fails
    console.log("⚠️  Using fallback rule-based analysis instead\n");
    return fallbackAnalysis(mlRawScore, inputData, historicalData);
  }
}

/**
 * Build historical context summary
 */
function buildHistoricalContext(data: HistoricalDataPoint[]): string {
  if (data.length === 0) {
    return "No historical data available (first prediction)";
  }

  const recent = data.slice(-5);
  const scores = recent.map((d) => d.gemini_final_score.toFixed(3)).join(", ");

  return `Last ${recent.length} predictions: [${scores}]
Total historical records: ${data.length}`;
}

/**
 * Analyze trend from historical data
 */
function analyzeTrend(data: HistoricalDataPoint[]): string {
  if (data.length < 3) {
    return "Insufficient data for trend analysis";
  }

  const recent = data.slice(-5);
  const scores = recent.map((d) => d.gemini_final_score);

  const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
  const secondHalf = scores.slice(Math.ceil(scores.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = avgSecond - avgFirst;

  if (change > 0.05) return "Degrading trend detected (health scores increasing)";
  if (change < -0.05) return "Improving trend detected (health scores decreasing)";
  return "Stable trend (health scores consistent)";
}

/**
 * Analyze maintenance history
 */
function analyzeMaintenanceHistory(data: HistoricalDataPoint[]): string {
  if (data.length === 0) {
    return "No maintenance history available";
  }

  const recentMaintenance = data
    .slice(-10)
    .filter((d) => d.oil_refill_start === 1 || d.oil_topup === 1);

  if (recentMaintenance.length === 0) {
    return "No recent maintenance events (last 10 records)";
  }

  const lastMaintenance = recentMaintenance[recentMaintenance.length - 1];
  return `Last maintenance: ${lastMaintenance.oil_refill_start === 1 ? "Oil refill" : "Oil top-up"}`;
}

/**
 * Fallback rule-based analysis if Gemini fails
 */
function fallbackAnalysis(
  mlScore: number,
  inputData: ShipDataInput,
  historicalData: HistoricalDataPoint[]
): GeminiAnalysis {
  let finalScore = mlScore;
  let status: HealthStatus = "NORMAL_WEAR";
  let trend: TrendDirection = "STABLE";

  // Adjust based on maintenance
  if (inputData.oil_refill_start === 1) {
    finalScore *= 0.7; // Oil change improves health
  }

  // Determine status
  if (finalScore < 0.25) status = "OPTIMAL_CONDITION";
  else if (finalScore < 0.40) status = "NORMAL_WEAR";
  else if (finalScore < 0.55) status = "ATTENTION_REQUIRED";
  else if (finalScore < 0.75) status = "MAINTENANCE_DUE";
  else status = "CRITICAL_ALERT";

  // Simple trend analysis
  if (historicalData.length >= 3) {
    const recent = historicalData.slice(-3);
    const avgRecent = recent.reduce((sum, d) => sum + d.gemini_final_score, 0) / recent.length;
    if (finalScore > avgRecent + 0.05) trend = "DEGRADING";
    else if (finalScore < avgRecent - 0.05) trend = "IMPROVING";
  }

  return {
    final_score: finalScore,
    status,
    trend,
    recommendation: "Continue monitoring. Gemini analysis unavailable, using fallback system.",
  };
}
