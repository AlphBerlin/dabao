import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Organization, getUserOrganizations } from '@/lib/api';
import { toast } from 'sonner';

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  isLoading: boolean;
  error: string | null;
  setCurrentOrganization: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add a cache-busting query parameter to avoid browser caching
      const orgs = await getUserOrganizations();
      
      if (orgs.length === 0) {
        console.log('No organizations found');
      } else {
        console.log(`Found ${orgs.length} organizations`);
      }
      
      setOrganizations(orgs);
      
      // Set current organization to the first one if not already set
      // or if the current organization is not in the list anymore
      if (orgs.length > 0) {
        if (!currentOrganization || !orgs.find(org => org.id === currentOrganization.id)) {
          const savedOrgId = localStorage.getItem('currentOrganizationId');
          const savedOrg = savedOrgId ? orgs.find(org => org.id === savedOrgId) : null;
          setCurrentOrganization(savedOrg || orgs[0]);
        }
      } else {
        // If no organizations, reset current organization
        setCurrentOrganization(null);
      }
      
      return orgs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
      console.error('Error fetching organizations:', err);
      toast.error(`Error loading organizations: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrentOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem('currentOrganizationId', org.id);
    toast.success(`Switched to ${org.name}`);
  };

  useEffect(() => {
    refreshOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        isLoading,
        error,
        setCurrentOrganization: handleSetCurrentOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}