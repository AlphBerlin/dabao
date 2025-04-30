import { NextResponse } from "next/server";

/**
 * Health check endpoint for the www application
 * Used by container orchestration for health monitoring
 */
export function GET() {
  return NextResponse.json(
    { 
      status: "ok",
      service: "www",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}