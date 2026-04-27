import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check endpoint — verifies the API is running.
 * Does NOT connect to MongoDB (that will happen in later phases).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PropertyCRM API is running",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
}
