/**
 * Import Historical Ship Data into SQLite Database
 *
 * This script reads the CSV file from the ship_prediction_project
 * and imports it into the SQLite database with proper formatting.
 *
 * Run with: npx tsx scripts/import-historical-data.ts
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import Database from 'better-sqlite3';
import { HealthStatus, TrendDirection } from '../lib/types';

const CSV_PATH = path.join(__dirname, '../../ship_prediction_project/enhanced_gajabahu_data_with_health_scores.csv');
const DB_PATH = path.join(__dirname, '../data/ship_data.db');

interface CSVRow {
  'Sample ID': string;
  'Oil Hrs': string;
  'Total Hrs': string;
  'Visc @40°C': string;
  'Fe (ppm)': string;
  'Pb (ppm)': string;
  'Cu (ppm)': string;
  'Al (ppm)': string;
  'Si (ppm)': string;
  'Oil Refill Start': string;
  'Oil Top-up': string;
  'Health_Score': string;
  'Health_Score_Lag_1': string;
}

// Helper function to determine status from health score
function getStatusFromScore(score: number): HealthStatus {
  if (score < 0.25) return 'OPTIMAL_CONDITION';
  if (score < 0.40) return 'NORMAL_WEAR';
  if (score < 0.55) return 'ATTENTION_REQUIRED';
  if (score < 0.75) return 'MAINTENANCE_DUE';
  return 'CRITICAL_ALERT';
}

// Helper function to determine trend
function getTrend(currentScore: number, previousScore: number): TrendDirection {
  const diff = currentScore - previousScore;
  if (diff < -0.05) return 'IMPROVING';
  if (diff > 0.05) return 'DEGRADING';
  return 'STABLE';
}

// Helper function to generate recommendation
function getRecommendation(status: HealthStatus, trend: TrendDirection): string {
  const recommendations = {
    'OPTIMAL_CONDITION': {
      'IMPROVING': 'Continue current maintenance schedule, system performing well',
      'STABLE': 'Maintain current operations, all parameters normal',
      'DEGRADING': 'Monitor closely, slight degradation detected'
    },
    'NORMAL_WEAR': {
      'IMPROVING': 'Recent maintenance effective, continue monitoring',
      'STABLE': 'Expected wear patterns, maintain routine schedule',
      'DEGRADING': 'Schedule inspection, wear increasing gradually'
    },
    'ATTENTION_REQUIRED': {
      'IMPROVING': 'Improvements noted, continue corrective actions',
      'STABLE': 'Elevated indicators, plan inspection within 30 days',
      'DEGRADING': 'Increasing wear detected, schedule inspection soon'
    },
    'MAINTENANCE_DUE': {
      'IMPROVING': 'Maintenance improvements visible, continue monitoring',
      'STABLE': 'Service required, plan maintenance within 2 weeks',
      'DEGRADING': 'Accelerated wear detected, prioritize maintenance'
    },
    'CRITICAL_ALERT': {
      'IMPROVING': 'Emergency measures effective, continue close monitoring',
      'STABLE': 'Critical condition, immediate inspection required',
      'DEGRADING': 'Severe degradation, immediate action required'
    }
  };

  return recommendations[status][trend];
}

// Parse CSV value safely
function parseFloat(value: string): number {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
}

async function importData() {
  console.log('📊 Starting historical data import...\n');

  // Check if CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found at: ${CSV_PATH}`);
    process.exit(1);
  }

  // Create data directory if it doesn't exist
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('✅ Created data directory');
  }

  // Initialize database
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create table
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

  console.log('✅ Database initialized\n');

  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO ship_data (
      timestamp, oil_hrs, total_hrs, viscosity_40,
      oil_refill_start, oil_topup, health_score_lag_1,
      fe_ppm, pb_ppm, cu_ppm, al_ppm, si_ppm,
      ml_raw_score, gemini_final_score, status, trend, recommendation, confidence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rows: CSVRow[] = [];

  // Read CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (data: CSVRow) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📖 Read ${rows.length} rows from CSV\n`);

  // Generate timestamps starting from 6 months ago, with weekly intervals
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  const daysBetween = Math.floor((180 * 24 * 60 * 60 * 1000) / rows.length); // Distribute over 6 months

  let imported = 0;
  let skipped = 0;

  const insertMany = db.transaction((rows: CSVRow[]) => {
    rows.forEach((row, index) => {
      try {
        const oilHrs = parseFloat(row['Oil Hrs']);
        const totalHrs = parseFloat(row['Total Hrs']);
        const viscosity = parseFloat(row['Visc @40°C']);
        const healthScore = parseFloat(row['Health_Score']);
        const healthScoreLag = parseFloat(row['Health_Score_Lag_1']);

        // Skip rows with missing critical data
        if (!oilHrs || !totalHrs || !viscosity || isNaN(healthScore)) {
          skipped++;
          return;
        }

        // Generate timestamp
        const timestamp = new Date(startDate.getTime() + (index * daysBetween));
        const timestampStr = timestamp.toISOString();

        // Parse maintenance flags
        const oilRefill = parseInt(row['Oil Refill Start']) || 0;
        const oilTopup = parseInt(row['Oil Top-up']) || 0;

        // Parse wear metals (handle missing values)
        const fePpm = parseFloat(row['Fe (ppm)']);
        const pbPpm = parseFloat(row['Pb (ppm)']);
        const cuPpm = parseFloat(row['Cu (ppm)']);
        const alPpm = parseFloat(row['Al (ppm)']);
        const siPpm = parseFloat(row['Si (ppm)']);

        // Determine status
        const status = getStatusFromScore(healthScore);

        // Determine trend
        const trend = getTrend(healthScore, healthScoreLag);

        // Generate recommendation
        const recommendation = getRecommendation(status, trend);

        stmt.run(
          timestampStr,
          oilHrs,
          totalHrs,
          viscosity,
          oilRefill,
          oilTopup,
          healthScoreLag,
          fePpm || null,
          pbPpm || null,
          cuPpm || null,
          alPpm || null,
          siPpm || null,
          healthScore, // Use health score as ML raw score
          healthScore, // Use health score as final score
          status,
          trend,
          recommendation,
          'historical' // Mark as historical data
        );

        imported++;
      } catch (error) {
        console.error(`Error processing row ${index}:`, error);
        skipped++;
      }
    });
  });

  insertMany(rows);

  console.log('✅ Import complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   - Total rows processed: ${rows.length}`);
  console.log(`   - Successfully imported: ${imported}`);
  console.log(`   - Skipped (missing data): ${skipped}`);
  console.log(`   - Database: ${DB_PATH}`);

  // Show sample data
  const sample = db.prepare('SELECT * FROM ship_data ORDER BY timestamp DESC LIMIT 3').all();
  console.log('\n📋 Sample of imported data (latest 3 records):');
  sample.forEach((record: any, i) => {
    console.log(`\n${i + 1}. ${record.timestamp}`);
    console.log(`   Score: ${(record.gemini_final_score * 100).toFixed(1)}`);
    console.log(`   Status: ${record.status}`);
    console.log(`   Trend: ${record.trend}`);
  });

  db.close();
  console.log('\n✅ Database connection closed');
}

// Run import
importData()
  .then(() => {
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
