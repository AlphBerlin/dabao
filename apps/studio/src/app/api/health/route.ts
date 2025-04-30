import { NextResponse } from "next/server";

/**
 * Health check endpoint for the studio application
 * Used by container orchestration for health monitoring
 */
export function GET() {
  return NextResponse.json(
    { 
      status: "ok",
      service: "studio",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}