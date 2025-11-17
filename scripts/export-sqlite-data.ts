/**
 * Export SQLite data to JSON for migration to Postgres
 * Run with: npx tsx scripts/export-sqlite-data.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "ship_data.db");
const OUTPUT_PATH = path.join(process.cwd(), "data", "sqlite_export.json");

async function exportData() {
  console.log("=".repeat(60));
  console.log("SQLite Data Export for Postgres Migration");
  console.log("=".repeat(60));

  try {
    // Check if SQLite database exists
    if (!fs.existsSync(DB_PATH)) {
      console.log("⚠️  No SQLite database found at:", DB_PATH);
      console.log("   Nothing to export.");
      process.exit(0);
    }

    // Connect to SQLite database
    console.log(`\n📦 Opening SQLite database: ${DB_PATH}`);
    const db = new Database(DB_PATH, { readonly: true });

    // Get all records
    const records = db
      .prepare(
        `
      SELECT * FROM ship_data
      ORDER BY timestamp ASC
    `
      )
      .all();

    console.log(`✅ Found ${records.length} records`);

    if (records.length === 0) {
      console.log("⚠️  Database is empty, nothing to export");
      db.close();
      process.exit(0);
    }

    // Show sample of first and last records
    console.log(`\n📊 Data Range:`);
    console.log(`   First Record: ${records[0].timestamp}`);
    console.log(`   Last Record: ${records[records.length - 1].timestamp}`);

    // Export to JSON
    console.log(`\n💾 Writing to: ${OUTPUT_PATH}`);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(records, null, 2));

    // Get file size
    const stats = fs.statSync(OUTPUT_PATH);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ Export complete!`);
    console.log(`   Records exported: ${records.length}`);
    console.log(`   File size: ${fileSizeKB} KB`);

    // Close database
    db.close();

    console.log("\n" + "=".repeat(60));
    console.log("✅ SQLite data exported successfully!");
    console.log("=".repeat(60));
    console.log(`\n📁 Export file: ${OUTPUT_PATH}`);
    console.log(`\n🚀 Next steps:`);
    console.log(`   1. Deploy to Vercel`);
    console.log(`   2. Set up Vercel Postgres`);
    console.log(`   3. Run: npx tsx scripts/import-to-postgres.ts`);
  } catch (error: any) {
    console.error("\n❌ Export failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

exportData();
