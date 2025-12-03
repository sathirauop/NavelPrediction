/**
 * In-Memory Storage for Ship Predictions
 * - Loads 60 base historical records from seed data (always available)
 * - New predictions are added in-memory (reset on restart)
 * - Perfect for Vercel deployment!
 */

import { HealthStatus, TrendDirection } from "./types";
import seedData from "./seed-data-new.json";

export interface StoredPrediction {
  id: number;
  timestamp: string;
  ship_name: string | null;
  oil_hrs: number;
  total_hrs: number;
  viscosity_40: number;
  viscosity_100: number | null;
  viscosity_index: number | null;
  oil_refill_start: number;
  oil_topup: number;
  health_score_lag_1: number;
  fe_ppm: number | null;
  pb_ppm: number | null;
  cu_ppm: number | null;
  al_ppm: number | null;
  si_ppm: number | null;
  cr_ppm: number | null;
  sn_ppm: number | null;
  ni_ppm: number | null;
  tbn: number | null;
  water_content: string | null;
  flash_point: number | null;
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
  confidence: string;
}

// Initialize with seed data (60 historical records)
let predictions: StoredPrediction[] = (seedData as any[]).map((item, index) => ({
  id: item.id,
  timestamp: item.created_at || new Date().toISOString(), // Use created_at as timestamp if available
  ship_name: item.ship_name || null,
  oil_hrs: item.oil_hrs,
  total_hrs: item.total_hrs,
  viscosity_40: item.viscosity_40,
  viscosity_100: item.viscosity_100 || null,
  viscosity_index: item.viscosity_index || null,
  oil_refill_start: item.oil_refill_start,
  oil_topup: item.oil_topup,
  health_score_lag_1: item.health_score_lag_1,
  fe_ppm: item.fe_ppm || null,
  pb_ppm: item.pb_ppm || null,
  cu_ppm: item.cu_ppm || null,
  al_ppm: item.al_ppm || null,
  si_ppm: item.si_ppm || null,
  cr_ppm: item.cr_ppm || null,
  sn_ppm: item.sn_ppm || null,
  ni_ppm: item.ni_ppm || null,
  tbn: item.tbn || null,
  water_content: item.water_content || null,
  flash_point: item.flash_point || null,
  ml_raw_score: item.ml_raw_score,
  gemini_final_score: item.gemini_final_score,
  status: item.status as HealthStatus,
  trend: item.trend as TrendDirection,
  recommendation: item.recommendation,
  confidence: item.confidence,
}));

let nextId = predictions.length + 1;

console.log(`📦 Loaded ${predictions.length} historical records from seed data`);

/**
 * Insert a new prediction
 */
export async function insertPrediction(data: {
  input: {
    ship_name?: string;
    oil_hrs: number;
    total_hrs: number;
    viscosity_40: number;
    viscosity_100?: number;
    viscosity_index?: number;
    oil_refill_start: number;
    oil_topup: number;
    health_score_lag_1: number;
    fe_ppm?: number;
    pb_ppm?: number;
    cu_ppm?: number;
    al_ppm?: number;
    si_ppm?: number;
    cr_ppm?: number;
    sn_ppm?: number;
    ni_ppm?: number;
    tbn?: number;
    water_content?: string;
    flash_point?: number;
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
    ship_name: data.input.ship_name || null,
    oil_hrs: data.input.oil_hrs,
    total_hrs: data.input.total_hrs,
    viscosity_40: data.input.viscosity_40,
    viscosity_100: data.input.viscosity_100 || null,
    viscosity_index: data.input.viscosity_index || null,
    oil_refill_start: data.input.oil_refill_start,
    oil_topup: data.input.oil_topup,
    health_score_lag_1: data.input.health_score_lag_1,
    fe_ppm: data.input.fe_ppm || null,
    pb_ppm: data.input.pb_ppm || null,
    cu_ppm: data.input.cu_ppm || null,
    al_ppm: data.input.al_ppm || null,
    si_ppm: data.input.si_ppm || null,
    cr_ppm: data.input.cr_ppm || null,
    sn_ppm: data.input.sn_ppm || null,
    ni_ppm: data.input.ni_ppm || null,
    tbn: data.input.tbn || null,
    water_content: data.input.water_content || null,
    flash_point: data.input.flash_point || null,
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
 * Get historical data filtered by ship
 */
export async function getHistoricalDataByShip(
  shipName: string,
  limit: number = 60
): Promise<StoredPrediction[]> {
  if (shipName === "ALL" || !shipName) {
    return getHistoricalData(limit);
  }
  const filtered = predictions.filter(p => p.ship_name === shipName);
  return filtered.slice(-limit);
}

/**
 * Get latest prediction by ship
 */
export async function getLatestPredictionByShip(
  shipName: string
): Promise<StoredPrediction | null> {
  if (shipName === "ALL" || !shipName) {
    return getLatestPrediction();
  }
  const filtered = predictions.filter(p => p.ship_name === shipName);
  if (filtered.length === 0) return null;
  return filtered[filtered.length - 1];
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
 * Initialize database (seed data is auto-loaded on module import)
 */
export async function initDatabase(): Promise<void> {
  console.log(`📦 In-memory storage initialized with ${predictions.length} records`);
  console.log(`   - ${seedData.length} base historical records (from seed-data.json)`);
  console.log(`   - ${predictions.length - seedData.length} new predictions (will reset on restart)`);
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
    ship_name: item.ship_name || null,
    oil_hrs: item.oil_hrs,
    total_hrs: item.total_hrs,
    viscosity_40: item.viscosity_40,
    viscosity_100: item.viscosity_100 || null,
    viscosity_index: item.viscosity_index || null,
    oil_refill_start: item.oil_refill_start,
    oil_topup: item.oil_topup,
    health_score_lag_1: item.health_score_lag_1,
    fe_ppm: item.fe_ppm || null,
    pb_ppm: item.pb_ppm || null,
    cu_ppm: item.cu_ppm || null,
    al_ppm: item.al_ppm || null,
    si_ppm: item.si_ppm || null,
    cr_ppm: item.cr_ppm || null,
    sn_ppm: item.sn_ppm || null,
    ni_ppm: item.ni_ppm || null,
    tbn: item.tbn || null,
    water_content: item.water_content || null,
    flash_point: item.flash_point || null,
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
