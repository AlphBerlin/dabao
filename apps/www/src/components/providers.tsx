"use client";

import { ReactNode } from "react";
import { UserProvider } from "@/contexts/user-context";
import { useThemePreference } from "@/hooks/use-theme-preference";

// Component to sync theme with user preferences
function ThemeSync() {
  useThemePreference();
  return null;
}

interface ProvidersProps {
  children: ReactNode;
  organizationData?: {
    currentOrganization: any;
    organizations: any[];
  };
}

/**
 * Client-side providers wrapper
 * This component receives server-side pre-loaded data from layout
 */
export function Providers({ 
  children, 
  organizationData
}: ProvidersProps) {
  return (
    <UserProvider>
      <ThemeSync />
      {children}
    </UserProvider>
  );
}