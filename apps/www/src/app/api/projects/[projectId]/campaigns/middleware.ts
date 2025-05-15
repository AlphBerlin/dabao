import { NextRequest, NextResponse } from "next/server";
import { checkFeatureFlag } from "@/lib/middleware/feature-flag";

/**
 * Middleware function to check if campaigns feature is enabled
 */
export function campaignsMiddleware(req: NextRequest): NextResponse | null {
  return checkFeatureFlag(req, "enableCampaigns");
}
