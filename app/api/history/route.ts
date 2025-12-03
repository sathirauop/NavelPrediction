/**
 * Historical Data API Route
 * Uses simple file storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllPredictions, getHistoricalData, getHistoricalDataByShip } from "@/lib/memory-storage";

// Force Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const ship = searchParams.get("ship");

    let data;

    // Filter by ship if provided
    if (ship && ship !== "ALL") {
      data = await getHistoricalDataByShip(ship, limit ? parseInt(limit) : 60);
    } else if (limit) {
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
