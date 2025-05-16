import { NextRequest, NextResponse } from "next/server";
import { featureFlags } from "@/config/features";

/**
 * Middleware function to check if a feature is enabled
 * 
 * @param req - The incoming request
 * @param feature - The feature flag to check
 * @returns NextResponse or null if the feature is enabled
 */
export function checkFeatureFlag(
  req: NextRequest,
  feature: keyof typeof featureFlags
): NextResponse | null {
  if (!featureFlags[feature]) {
    // Feature is disabled, return 404 Not Found
    return NextResponse.json(
      { error: "Feature not available" },
      { status: 404 }
    );
  }
  
  // Feature is enabled, continue processing
  return null;
}
