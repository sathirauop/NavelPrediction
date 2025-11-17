/**
 * Import SQLite data to Vercel Postgres
 * Run with: npx tsx scripts/import-to-postgres.ts
 *
 * Prerequisites:
 * 1. Vercel Postgres database created
 * 2. Environment variables set (POSTGRES_URL, etc.)
 * 3. Data exported using export-sqlite-data.ts
 */

import fs from "fs";
import path from "path";
import { importHistoricalData, initDatabase } from "../lib/database-postgres";

const DATA_PATH = path.join(process.cwd(), "data", "sqlite_export.json");

async function importData() {
  console.log("=".repeat(60));
  console.log("Import SQLite Data to Postgres");
  console.log("=".repeat(60));

  try {
    // Check if export file exists
    if (!fs.existsSync(DATA_PATH)) {
      console.log("❌ Export file not found:", DATA_PATH);
      console.log("\n📝 Please run export first:");
      console.log("   npx tsx scripts/export-sqlite-data.ts");
      process.exit(1);
    }

    // Check environment variables
    if (!process.env.POSTGRES_URL) {
      console.log("❌ POSTGRES_URL environment variable not set");
      console.log("\n📝 Please set up Vercel Postgres:");
      console.log("   1. Go to your Vercel project");
      console.log("   2. Add Postgres database");
      console.log("   3. Copy environment variables");
      console.log("   4. Add to .env.local file");
      process.exit(1);
    }

    console.log("\n🔑 Postgres connection configured");

    // Initialize database (create tables)
    console.log("\n📦 Initializing Postgres database...");
    await initDatabase();

    // Read export file
    console.log(`\n📁 Reading export file: ${DATA_PATH}`);
    const fileContent = fs.readFileSync(DATA_PATH, "utf-8");
    const records = JSON.parse(fileContent);

    console.log(`✅ Loaded ${records.length} records from export`);

    // Import data
    console.log("\n🚀 Starting import...");
    const result = await importHistoricalData(records);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Import Complete!");
    console.log("=".repeat(60));
    console.log(`   Total records: ${records.length}`);
    console.log(`   Imported successfully: ${result.imported}`);
    console.log(`   Failed: ${result.failed}`);

    if (result.failed > 0) {
      console.log("\n⚠️  Some records failed to import");
      console.log("   Check the error messages above for details");
    }

    console.log("\n🎉 Your data is now in Vercel Postgres!");
  } catch (error: any) {
    console.error("\n❌ Import failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

importData();
