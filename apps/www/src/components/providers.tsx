"use client";

import { ReactNode } from "react";

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
  return children;
}