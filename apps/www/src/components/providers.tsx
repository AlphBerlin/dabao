"use client";

import { ReactNode } from "react";
import { OrganizationProvider } from "@/contexts/organization-context";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  );
}