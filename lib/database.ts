/**
 * Database Operations - Postgres Adapter for Vercel
 *
 * This file exports the Postgres database adapter for production deployment on Vercel.
 * The SQLite version is preserved in database-sqlite.ts for local development if needed.
 */

export {
  initDatabase,
  insertPrediction,
  getHistoricalData,
  getLatestPrediction,
  getAllPredictions,
  getPredictionById,
  getDashboardStats,
  importHistoricalData,
  closeDatabase,
} from "./database-postgres";
