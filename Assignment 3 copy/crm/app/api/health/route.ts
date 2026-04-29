import { NextResponse } from "next/server";
import dbConnect from "../../../lib/mongodb";
import mongoose from "mongoose";

/**
 * GET /api/health
 * Health check endpoint — verifies the API is running and checks MongoDB connection.
 */
export async function GET() {
  let dbStatus = "disconnected";
  try {
    await dbConnect();
    dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  } catch (error) {
    dbStatus = "error";
  }

  return NextResponse.json({
    success: true,
    message: "PropertyCRM API is running",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
  });
}
