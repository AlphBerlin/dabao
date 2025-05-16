import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserOrganizations, Organization } from '../api';

interface UseOrganizationOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

export function useOrganization(options: UseOrganizationOptions = {}) {
  const { redirectTo = '/create-organization', redirectIfFound = false } = options;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrgs, setHasOrgs] = useState<boolean | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkOrganizations() {
      try {
        setIsLoading(true);
        const orgs = await getUserOrganizations();
        const userHasOrgs = orgs.length > 0;
        
        setHasOrgs(userHasOrgs);
        setOrganizations(orgs);
        
        if (!userHasOrgs && !redirectIfFound) {
          router.push(redirectTo);
        } else if (userHasOrgs && redirectIfFound) {
          router.push('/dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check organizations');
        console.error('Error in useOrganization hook:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkOrganizations();
  }, [redirectTo, redirectIfFound, router]);

  return {
    isLoading,
    hasOrganizations: hasOrgs,
    organizations,
    error,
  };
}