/**
 * In-Memory Storage for Ship Predictions
 * Perfect for Vercel deployment - no file system needed!
 * Note: Data is lost on server restart/redeploy
 */

import { HealthStatus, TrendDirection } from "./types";

export interface StoredPrediction {
  id: number;
  timestamp: string;
  oil_hrs: number;
  total_hrs: number;
  viscosity_40: number;
  oil_refill_start: number;
  oil_topup: number;
  health_score_lag_1: number;
  fe_ppm?: number;
  pb_ppm?: number;
  cu_ppm?: number;
  al_ppm?: number;
  si_ppm?: number;
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
  confidence: string;
}

// In-memory store (resets on server restart)
let predictions: StoredPrediction[] = [];
let nextId = 1;

/**
 * Insert a new prediction
 */
export async function insertPrediction(data: {
  input: {
    oil_hrs: number;
    total_hrs: number;
    viscosity_40: number;
    oil_refill_start: number;
    oil_topup: number;
    health_score_lag_1: number;
    fe_ppm?: number;
    pb_ppm?: number;
    cu_ppm?: number;
    al_ppm?: number;
    si_ppm?: number;
  };
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
  confidence: string;
}): Promise<number> {
  const newPrediction: StoredPrediction = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    oil_hrs: data.input.oil_hrs,
    total_hrs: data.input.total_hrs,
    viscosity_40: data.input.viscosity_40,
    oil_refill_start: data.input.oil_refill_start,
    oil_topup: data.input.oil_topup,
    health_score_lag_1: data.input.health_score_lag_1,
    fe_ppm: data.input.fe_ppm,
    pb_ppm: data.input.pb_ppm,
    cu_ppm: data.input.cu_ppm,
    al_ppm: data.input.al_ppm,
    si_ppm: data.input.si_ppm,
    ml_raw_score: data.ml_raw_score,
    gemini_final_score: data.gemini_final_score,
    status: data.status,
    trend: data.trend,
    recommendation: data.recommendation,
    confidence: data.confidence,
  };

  predictions.push(newPrediction);
  return newPrediction.id;
}

/**
 * Get latest prediction
 */
export async function getLatestPrediction(): Promise<StoredPrediction | null> {
  if (predictions.length === 0) return null;
  return predictions[predictions.length - 1];
}

/**
 * Get historical data (recent N records)
 */
export async function getHistoricalData(limit: number = 60): Promise<StoredPrediction[]> {
  return predictions.slice(-limit);
}

/**
 * Get all predictions
 */
export async function getAllPredictions(): Promise<StoredPrediction[]> {
  return [...predictions];
}

/**
 * Get prediction by ID
 */
export async function getPredictionById(id: number): Promise<StoredPrediction | null> {
  return predictions.find(p => p.id === id) || null;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<{
  total_predictions: number;
  avg_health_score: number;
  high_risk_count: number;
  latest_status: HealthStatus | string;
  trend_improving: number;
  trend_stable: number;
  trend_degrading: number;
}> {
  if (predictions.length === 0) {
    return {
      total_predictions: 0,
      avg_health_score: 0,
      high_risk_count: 0,
      latest_status: "No data",
      trend_improving: 0,
      trend_stable: 0,
      trend_degrading: 0,
    };
  }

  const totalScore = predictions.reduce((sum, p) => sum + p.gemini_final_score, 0);
  const highRisk = predictions.filter(p => p.gemini_final_score >= 0.5).length;
  const latest = predictions[predictions.length - 1];

  const trendCounts = predictions.reduce(
    (acc, p) => {
      if (p.trend.toLowerCase().includes("improv")) acc.improving++;
      else if (p.trend.toLowerCase().includes("stable")) acc.stable++;
      else acc.degrading++;
      return acc;
    },
    { improving: 0, stable: 0, degrading: 0 }
  );

  return {
    total_predictions: predictions.length,
    avg_health_score: totalScore / predictions.length,
    high_risk_count: highRisk,
    latest_status: latest.status,
    trend_improving: trendCounts.improving,
    trend_stable: trendCounts.stable,
    trend_degrading: trendCounts.degrading,
  };
}

/**
 * Initialize database (no-op for in-memory storage)
 */
export async function initDatabase(): Promise<void> {
  console.log("📦 Using in-memory storage (data resets on server restart)");
}

/**
 * Close database (no-op for in-memory storage)
 */
export async function closeDatabase(): Promise<void> {
  // No-op
}

/**
 * Import historical data
 */
export async function importHistoricalData(data: any[]): Promise<number> {
  predictions = data.map((item, index) => ({
    id: index + 1,
    timestamp: item.timestamp || new Date().toISOString(),
    oil_hrs: item.oil_hrs,
    total_hrs: item.total_hrs,
    viscosity_40: item.viscosity_40,
    oil_refill_start: item.oil_refill_start,
    oil_topup: item.oil_topup,
    health_score_lag_1: item.health_score_lag_1,
    fe_ppm: item.fe_ppm,
    pb_ppm: item.pb_ppm,
    cu_ppm: item.cu_ppm,
    al_ppm: item.al_ppm,
    si_ppm: item.si_ppm,
    ml_raw_score: item.ml_raw_score,
    gemini_final_score: item.gemini_final_score,
    status: item.status,
    trend: item.trend,
    recommendation: item.recommendation,
    confidence: item.confidence,
  }));

  nextId = predictions.length + 1;
  return predictions.length;
}

/**
 * Clear all data (useful for testing)
 */
export async function clearAllData(): Promise<void> {
  predictions = [];
  nextId = 1;
}
