/**
 * SQLite Database Operations for Naval Predictions
 */

import Database from "better-sqlite3";
import path from "path";
import { HistoricalDataPoint, ShipDataInput, PredictionResult, HealthStatus, TrendDirection } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "ship_data.db");

let db: Database.Database | null = null;

/**
 * Initialize database connection
 */
export function initDatabase(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    createTables();
  }
  return db;
}

/**
 * Create database tables if they don't exist
 */
function createTables() {
  const db = initDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS ship_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ Database tables initialized");
}

/**
 * Insert a new prediction record
 */
export function insertPrediction(data: {
  input: ShipDataInput;
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
  confidence: string;
}): number {
  const db = initDatabase();

  const stmt = db.prepare(`
    INSERT INTO ship_data (
      timestamp, oil_hrs, total_hrs, viscosity_40,
      oil_refill_start, oil_topup, health_score_lag_1,
      fe_ppm, pb_ppm, cu_ppm, al_ppm, si_ppm,
      ml_raw_score, gemini_final_score, status, trend, recommendation, confidence
    ) VALUES (
      datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const result = stmt.run(
    data.input.oil_hrs,
    data.input.total_hrs,
    data.input.viscosity_40,
    data.input.oil_refill_start,
    data.input.oil_topup,
    data.input.health_score_lag_1,
    data.input.fe_ppm || null,
    data.input.pb_ppm || null,
    data.input.cu_ppm || null,
    data.input.al_ppm || null,
    data.input.si_ppm || null,
    data.ml_raw_score,
    data.gemini_final_score,
    data.status,
    data.trend,
    data.recommendation,
    data.confidence
  );

  return result.lastInsertRowid as number;
}

/**
 * Get historical data (last N records)
 */
export function getHistoricalData(limit: number = 20): HistoricalDataPoint[] {
  const db = initDatabase();

  const stmt = db.prepare(`
    SELECT * FROM ship_data
    ORDER BY timestamp DESC
    LIMIT ?
  `);

  const rows = stmt.all(limit) as HistoricalDataPoint[];
  return rows.reverse(); // Return in chronological order
}

/**
 * Get latest prediction
 */
export function getLatestPrediction(): HistoricalDataPoint | null {
  const db = initDatabase();

  const stmt = db.prepare(`
    SELECT * FROM ship_data
    ORDER BY timestamp DESC
    LIMIT 1
  `);

  return stmt.get() as HistoricalDataPoint | null;
}

/**
 * Get all predictions
 */
export function getAllPredictions(): HistoricalDataPoint[] {
  const db = initDatabase();

  const stmt = db.prepare(`
    SELECT * FROM ship_data
    ORDER BY timestamp DESC
  `);

  return stmt.all() as HistoricalDataPoint[];
}

/**
 * Get prediction by ID
 */
export function getPredictionById(id: number): HistoricalDataPoint | null {
  const db = initDatabase();

  const stmt = db.prepare(`
    SELECT * FROM ship_data
    WHERE id = ?
  `);

  return stmt.get(id) as HistoricalDataPoint | null;
}

/**
 * Get statistics for dashboard
 */
export function getDashboardStats() {
  const db = initDatabase();

  // Total predictions
  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM ship_data`);
  const total = (totalStmt.get() as { count: number }).count;

  // Latest prediction
  const latest = getLatestPrediction();

  // Average score last 7 days
  const avgStmt = db.prepare(`
    SELECT AVG(gemini_final_score) as avg_score
    FROM ship_data
    WHERE timestamp >= datetime('now', '-7 days')
  `);
  const avgResult = avgStmt.get() as { avg_score: number };

  // Critical alerts count (last 30 days)
  const criticalStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM ship_data
    WHERE status = 'CRITICAL_ALERT'
    AND timestamp >= datetime('now', '-30 days')
  `);
  const criticalCount = (criticalStmt.get() as { count: number }).count;

  return {
    total_predictions: total,
    latest_score: latest?.gemini_final_score || 0,
    latest_status: latest?.status || "OPTIMAL_CONDITION",
    average_score_7_days: avgResult.avg_score || 0,
    trend_direction: latest?.trend || "STABLE",
    critical_alerts_count: criticalCount,
  };
}

/**
 * Import historical data from CSV (for initial setup)
 */
export function importHistoricalDataFromCSV(records: any[]) {
  const db = initDatabase();

  const stmt = db.prepare(`
    INSERT INTO ship_data (
      timestamp, oil_hrs, total_hrs, viscosity_40,
      oil_refill_start, oil_topup, health_score_lag_1,
      fe_ppm, pb_ppm, cu_ppm, al_ppm, si_ppm,
      ml_raw_score, gemini_final_score, status, trend, recommendation, confidence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((records) => {
    for (const record of records) {
      stmt.run(
        record.timestamp,
        record.oil_hrs,
        record.total_hrs,
        record.viscosity_40,
        record.oil_refill_start,
        record.oil_topup,
        record.health_score_lag_1,
        record.fe_ppm,
        record.pb_ppm,
        record.cu_ppm,
        record.al_ppm,
        record.si_ppm,
        record.ml_raw_score,
        record.gemini_final_score,
        record.status,
        record.trend,
        record.recommendation,
        record.confidence
      );
    }
  });

  insertMany(records);
  console.log(`✅ Imported ${records.length} historical records`);
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
