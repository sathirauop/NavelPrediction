/**
 * Dashboard Statistics API Route
 * Uses simple file storage
 */

import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/memory-storage";

// Force Node.js runtime for file system access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
