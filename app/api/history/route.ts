/**
 * Historical Data API Route
 * Uses simple file storage with automatic seed data loading
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllPredictions, getHistoricalData, reloadSeedData, getCurrentSelection } from "@/lib/memory-storage";
import { DEFAULT_SELECTION } from "@/lib/machinery-config";
import fs from "fs";
import path from "path";

// Force Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Load seed data from file if memory is empty OR if selection has changed
 */
async function ensureSeedDataLoaded(ship?: string, machineryType?: string, model?: string) {
  // Use provided selection or current selection or default
  const currentSelection = getCurrentSelection();
  const selection = {
    ship: ship || currentSelection?.ship || DEFAULT_SELECTION.ship,
    machineryType: machineryType || currentSelection?.machineryType || DEFAULT_SELECTION.machineryType,
    model: model || currentSelection?.model || DEFAULT_SELECTION.model,
  };

  // Check if data is already loaded AND matches the requested selection
  const existingData = await getAllPredictions();
  if (existingData.length > 0 && currentSelection) {
    // Check if the selection has changed
    const selectionChanged =
      currentSelection.ship !== selection.ship ||
      currentSelection.machineryType !== selection.machineryType ||
      currentSelection.model !== selection.model;

    if (!selectionChanged) {
      return; // Data already loaded for this selection
    }

    console.log(`🔄 Selection changed from ${currentSelection.ship}-${currentSelection.machineryType}-${currentSelection.model} to ${selection.ship}-${selection.machineryType}-${selection.model}`);
  }

  // Load seed data from file
  const fileName = `seed-data-${selection.ship}-${selection.machineryType}-${selection.model}.json`;
  const filePath = path.join(process.cwd(), "lib", "seed-data", fileName);

  if (fs.existsSync(filePath)) {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const seedData = JSON.parse(fileContent);
      await reloadSeedData(seedData, selection);
      console.log(`📦 Loaded seed data: ${fileName} (${seedData.length} records)`);
    } catch (error) {
      console.error(`Failed to load seed data from ${fileName}:`, error);
    }
  } else {
    console.warn(`Seed data file not found: ${fileName}`);
  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const ship = searchParams.get("ship");
    const machineryType = searchParams.get("machineryType");
    const model = searchParams.get("model");

    // Ensure seed data is loaded (auto-load if empty)
    await ensureSeedDataLoaded(ship || undefined, machineryType || undefined, model || undefined);

    let data;
    if (limit) {
      data = await getHistoricalData(parseInt(limit));
    } else {
      data = await getAllPredictions();
    }

    return NextResponse.json({
      count: data.length,
      data: data,
    });
  } catch (error: any) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}
