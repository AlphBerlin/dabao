"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setCookie, getCookie } from "@/lib/utils/cookies";
import { useRouter } from "next/navigation";

// Organization interface
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  role?: string;
}

// Organization context interface
interface OrganizationContextProps {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  setCurrentOrganization: (organization: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

// Create default context with safe fallbacks
const defaultOrganizationContext: OrganizationContextProps = {
  currentOrganization: null,
  organizations: [],
  isLoading: false,
  error: null,
  setCurrentOrganization: () => {
    console.warn("OrganizationProvider not initialized");
  },
  refreshOrganizations: async () => {
    console.warn("OrganizationProvider not initialized");
    return Promise.resolve();
  }
};

// Create the context
const OrganizationContext = createContext<OrganizationContextProps>(
  defaultOrganizationContext
);

// Provider props interface
interface OrganizationProviderProps {
  children: React.ReactNode;
  initialOrganization?: Organization | null;
  initialOrganizations?: Organization[];
}

/**
 * Organization context provider
 */
export function OrganizationProvider({
  children,
  initialOrganization = null,
  initialOrganizations = [],
}: OrganizationProviderProps) {
  const [currentOrganization, setCurrentOrgState] = useState<Organization | null>(
    initialOrganization
  );
  const [organizations, setOrganizations] = useState<Organization[]>(
    initialOrganizations
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch organizations from the API
  const fetchOrganizations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/organizations", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch organizations: ${response.status}`);
      }

      const data = await response.json();
      setOrganizations(data);
      
      // If no current org is set but we have orgs, set the first one
      if (!currentOrganization && data.length > 0) {
        setCurrentOrgState(data[0]);
        await updateOrgIdCookie(data[0].id);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch organizations");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Update org ID cookie and headers
  const updateOrgIdCookie = async (orgId: string) => {
    // Set the cookie
    setCookie("orgId", orgId, { path: "/" });
    
    // Refresh the router to ensure server components get updated context
    router.refresh();
    
    // Also update API context for any future API calls
    try {
      const response = await fetch("/api/user/context", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update organization context: ${response.status}`);
      }
    } catch (err) {
      console.error("Error updating organization context:", err);
    }
  };

  // Handle organization change
  const setCurrentOrganization = async (org: Organization) => {
    setCurrentOrgState(org);
    await updateOrgIdCookie(org.id);
  };

  // Load organizations on mount
  useEffect(() => {
    const initializeContext = async () => {
      // If we have initial organizations but no current org, try to get from cookie
      if (organizations.length > 0 && !currentOrganization) {
        const orgIdFromCookie = await getCookie("orgId");
        
        if (orgIdFromCookie) {
          const matchingOrg = organizations.find(org => org.id === orgIdFromCookie);
          if (matchingOrg) {
            setCurrentOrgState(matchingOrg);
            return;
          }
        }
        
        // If no match or no cookie, set the first org as default
        setCurrentOrgState(organizations[0]!);
        await updateOrgIdCookie(organizations[0]!.id);
        return;
      }
      
      // If we don't have organizations yet, fetch them
      if (organizations.length === 0) {
        await fetchOrganizations();
      } else {
        setIsLoading(false);
      }
    };

    initializeContext();
  }, []);

  // Provide refresh function to force update of organizations
  const refreshOrganizations = async () => {
    return fetchOrganizations();
  };

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        isLoading,
        error,
        setCurrentOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook to use the organization context
 */
export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  
  // For development only: warn when used outside provider (but don't throw)
  if (process.env.NODE_ENV !== 'production' && context === defaultOrganizationContext) {
    console.warn("useOrganizationContext was used outside of OrganizationProvider. Make sure the component is wrapped within an OrganizationProvider.");
  }
  
  return context;
}