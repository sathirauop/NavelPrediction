/**
 * Postgres Database Operations for Naval Predictions
 * Using Vercel Postgres for production deployment
 */

import { sql } from "@vercel/postgres";
import {
  HistoricalDataPoint,
  ShipDataInput,
  HealthStatus,
  TrendDirection,
} from "./types";

/**
 * Initialize database tables
 */
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS ship_data (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        oil_hrs REAL NOT NULL,
        total_hrs REAL NOT NULL,
        viscosity_40 REAL NOT NULL,
        oil_refill_start INTEGER NOT NULL,
        oil_topup INTEGER NOT NULL,
        health_score_lag_1 REAL NOT NULL,
        fe_ppm REAL,
        pb_ppm REAL,
        cu_ppm REAL,
        al_ppm REAL,
        si_ppm REAL,
        ml_raw_score REAL NOT NULL,
        gemini_final_score REAL NOT NULL,
        status TEXT NOT NULL,
        trend TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        confidence TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_timestamp ON ship_data(timestamp DESC)
    `;

    console.log("✅ Postgres database tables initialized");
  } catch (error: any) {
    console.error("❌ Failed to initialize Postgres database:", error.message);
    throw error;
  }
}

/**
 * Insert a new prediction record
 */
export async function insertPrediction(data: {
  input: ShipDataInput;
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
  confidence: string;
}): Promise<number> {
  try {
    const result = await sql`
      INSERT INTO ship_data (
        oil_hrs, total_hrs, viscosity_40,
        oil_refill_start, oil_topup, health_score_lag_1,
        fe_ppm, pb_ppm, cu_ppm, al_ppm, si_ppm,
        ml_raw_score, gemini_final_score, status, trend, recommendation, confidence,
        timestamp
      ) VALUES (
        ${data.input.oil_hrs},
        ${data.input.total_hrs},
        ${data.input.viscosity_40},
        ${data.input.oil_refill_start},
        ${data.input.oil_topup},
        ${data.input.health_score_lag_1},
        ${data.input.fe_ppm || null},
        ${data.input.pb_ppm || null},
        ${data.input.cu_ppm || null},
        ${data.input.al_ppm || null},
        ${data.input.si_ppm || null},
        ${data.ml_raw_score},
        ${data.gemini_final_score},
        ${data.status},
        ${data.trend},
        ${data.recommendation},
        ${data.confidence},
        NOW()
      )
      RETURNING id
    `;

    return result.rows[0].id;
  } catch (error: any) {
    console.error("❌ Failed to insert prediction:", error.message);
    throw error;
  }
}

/**
 * Get historical data (last N records)
 */
export async function getHistoricalData(
  limit: number = 20
): Promise<HistoricalDataPoint[]> {
  try {
    const result = await sql`
      SELECT * FROM ship_data
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    // Return in chronological order (oldest to newest)
    return result.rows.reverse() as HistoricalDataPoint[];
  } catch (error: any) {
    console.error("❌ Failed to get historical data:", error.message);
    return []; // Return empty array on error
  }
}

/**
 * Get latest prediction
 */
export async function getLatestPrediction(): Promise<HistoricalDataPoint | null> {
  try {
    const result = await sql`
      SELECT * FROM ship_data
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    return result.rows.length > 0 ? (result.rows[0] as HistoricalDataPoint) : null;
  } catch (error: any) {
    console.error("❌ Failed to get latest prediction:", error.message);
    return null;
  }
}

/**
 * Get all predictions
 */
export async function getAllPredictions(): Promise<HistoricalDataPoint[]> {
  try {
    const result = await sql`
      SELECT * FROM ship_data
      ORDER BY timestamp DESC
    `;

    return result.rows as HistoricalDataPoint[];
  } catch (error: any) {
    console.error("❌ Failed to get all predictions:", error.message);
    return [];
  }
}

/**
 * Get prediction by ID
 */
export async function getPredictionById(
  id: number
): Promise<HistoricalDataPoint | null> {
  try {
    const result = await sql`
      SELECT * FROM ship_data
      WHERE id = ${id}
    `;

    return result.rows.length > 0 ? (result.rows[0] as HistoricalDataPoint) : null;
  } catch (error: any) {
    console.error("❌ Failed to get prediction by ID:", error.message);
    return null;
  }
}

/**
 * Get statistics for dashboard
 */
export async function getDashboardStats() {
  try {
    // Total predictions
    const totalResult = await sql`SELECT COUNT(*) as count FROM ship_data`;
    const total = totalResult.rows[0].count;

    // Latest prediction
    const latest = await getLatestPrediction();

    // Average score last 7 days
    const avgResult = await sql`
      SELECT AVG(gemini_final_score) as avg_score
      FROM ship_data
      WHERE timestamp >= NOW() - INTERVAL '7 days'
    `;
    const avgScore = avgResult.rows[0]?.avg_score || 0;

    // Critical alerts count (last 30 days)
    const criticalResult = await sql`
      SELECT COUNT(*) as count
      FROM ship_data
      WHERE status = 'CRITICAL_ALERT'
      AND timestamp >= NOW() - INTERVAL '30 days'
    `;
    const criticalCount = criticalResult.rows[0].count;

    return {
      total_predictions: total,
      latest_score: latest?.gemini_final_score || 0,
      latest_status: latest?.status || "OPTIMAL_CONDITION",
      average_score_7_days: avgScore,
      trend_direction: latest?.trend || "STABLE",
      critical_alerts_count: criticalCount,
    };
  } catch (error: any) {
    console.error("❌ Failed to get dashboard stats:", error.message);
    return {
      total_predictions: 0,
      latest_score: 0,
      latest_status: "OPTIMAL_CONDITION" as HealthStatus,
      average_score_7_days: 0,
      trend_direction: "STABLE" as TrendDirection,
      critical_alerts_count: 0,
    };
  }
}

/**
 * Import historical data from SQLite export
 */
export async function importHistoricalData(records: any[]) {
  try {
    console.log(`📥 Importing ${records.length} historical records...`);

    let imported = 0;
    let failed = 0;

    for (const record of records) {
      try {
        await sql`
          INSERT INTO ship_data (
            timestamp, oil_hrs, total_hrs, viscosity_40,
            oil_refill_start, oil_topup, health_score_lag_1,
            fe_ppm, pb_ppm, cu_ppm, al_ppm, si_ppm,
            ml_raw_score, gemini_final_score, status, trend, recommendation, confidence
          ) VALUES (
            ${record.timestamp},
            ${record.oil_hrs},
            ${record.total_hrs},
            ${record.viscosity_40},
            ${record.oil_refill_start},
            ${record.oil_topup},
            ${record.health_score_lag_1},
            ${record.fe_ppm},
            ${record.pb_ppm},
            ${record.cu_ppm},
            ${record.al_ppm},
            ${record.si_ppm},
            ${record.ml_raw_score},
            ${record.gemini_final_score},
            ${record.status},
            ${record.trend},
            ${record.recommendation},
            ${record.confidence}
          )
        `;
        imported++;
      } catch (err) {
        console.error(`Failed to import record ${record.id}:`, err);
        failed++;
      }
    }

    console.log(`✅ Imported ${imported} records successfully`);
    if (failed > 0) {
      console.log(`⚠️  Failed to import ${failed} records`);
    }

    return { imported, failed };
  } catch (error: any) {
    console.error("❌ Failed to import historical data:", error.message);
    throw error;
  }
}

/**
 * Close database connection (no-op for Vercel Postgres)
 */
export function closeDatabase() {
  // Vercel Postgres handles connection pooling automatically
  console.log("✅ Database connection closed (managed by Vercel)");
}
