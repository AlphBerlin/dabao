import { NextResponse } from "next/server";

/**
 * Health check endpoint for the client application
 * Used by container orchestration for health monitoring
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: "ok",
      service: "client",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}