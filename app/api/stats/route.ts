/**
 * Dashboard Statistics API Route
 */

import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/database";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
