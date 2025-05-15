/**
 * Route protection based on feature flags
 * 
 * This component checks if a route is accessible based on feature flags
 * and redirects to a fallback route if the feature is disabled.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isFeatureEnabled } from "@/config/features";

interface RouteGuardProps {
  featureFlag: keyof typeof import("@/config/features").featureFlags;
  fallbackPath: string;
  children: React.ReactNode;
}

export function RouteGuard({
  featureFlag,
  fallbackPath,
  children
}: RouteGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if the feature is disabled
    if (!isFeatureEnabled(featureFlag)) {
      // Redirect to the fallback path
      router.push(fallbackPath);
    }
  }, [featureFlag, fallbackPath, router]);

  // If the feature is enabled, render the children
  if (isFeatureEnabled(featureFlag)) {
    return <>{children}</>;
  }
  
  // Return null to prevent flash of content before redirect
  return null;
}
