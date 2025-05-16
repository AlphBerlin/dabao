# Feature Flag System

This document explains how to use the feature flag system in the Dabao application.

## Overview

Feature flags (also known as feature toggles) allow you to enable or disable certain features in the application without deploying new code. They're a powerful tool for gradual rollouts, A/B testing, or temporarily disabling problematic features.

## How to Use

### Configuration

All feature flags are defined in `/apps/www/src/config/features.ts`. This is the central place for managing which features are enabled or disabled.

```typescript
export const featureFlags: FeatureFlags = {
  enableCampaigns: false, // Set to false to disable campaigns feature
  // Add more feature flags here
};
```

### Checking Feature Flags in Components

For client-side components, use the `isFeatureEnabled` function:

```typescript
import { isFeatureEnabled } from "@/config/features";

function MyComponent() {
  // Conditionally render based on feature flag
  return (
    <>
      {isFeatureEnabled('enableCampaigns') && (
        <button>Create Campaign</button>
      )}
    </>
  );
}
```

### Route Protection

For route protection, we use two approaches:

1. **Server-side protection**: In server components or API routes, check the feature flag and redirect or return an error:

```typescript
import { featureFlags } from "@/config/features";

export default async function ServerComponent() {
  if (!featureFlags.enableCampaigns) {
    redirect('/fallback-page');
  }
  
  // Continue with component logic
}
```

2. **Client-side protection**: Use the `RouteGuard` component:

```typescript
import { RouteGuard } from "@/components/route-guard";

function ProtectedPage() {
  return (
    <RouteGuard
      featureFlag="enableCampaigns"
      fallbackPath="/dashboard"
    >
      <YourComponent />
    </RouteGuard>
  );
}
```

### API Route Protection

API routes are protected using middleware:

```typescript
import { campaignsMiddleware } from "./middleware";

export async function GET(req: NextRequest) {
  // Check if feature is enabled
  const featureCheck = campaignsMiddleware(req);
  if (featureCheck) {
    return featureCheck; // Returns 404 if feature is disabled
  }
  
  // Continue with API logic
}
```

## Existing Feature Flags

- `enableCampaigns`: Controls the campaigns feature, including UI elements, routes, and API endpoints.

## Adding New Feature Flags

1. Add your feature flag to the `FeatureFlags` interface in `/apps/www/src/config/features.ts`
2. Set the default value in the `featureFlags` object 
3. Use the `isFeatureEnabled` function to conditionally render components
4. Add route protection for any new routes
5. Document your new feature flag in this file
