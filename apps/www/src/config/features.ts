/**
 * Feature Flag Configuration
 * 
 * This file contains the configuration for feature flags in the application.
 * Use this to enable or disable features across the application.
 */

interface FeatureFlags {
  /**
   * Enable/disable the campaigns feature
   */
  enableCampaigns: boolean;
}

/**
 * Default feature flag configuration
 */
export const featureFlags: FeatureFlags = {
  enableCampaigns: false, // Set to false to disable campaigns feature
};

/**
 * Helper function to check if a feature is enabled
 * @param feature - The name of the feature to check
 * @returns boolean - Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature];
}
