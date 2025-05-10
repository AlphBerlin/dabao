import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_API } from '@/lib/api/project';

interface UseAuthorizationProps {
  projectId?: string;
  resource: string;
  action: string;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Custom hook for client-side authorization checks
 * @param projectId The ID of the current project
 * @param resource The resource to check permissions for
 * @param action The action to check permissions for
 * @param redirectTo Optional URL to redirect to if unauthorized
 * @param fallback Optional fallback component to render if unauthorized
 */
export function useAuthorization({
  projectId,
  resource,
  action,
  redirectTo,
  fallback,
}: UseAuthorizationProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const checkPermission = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setAuthorized(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/auth/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resource, action }),
      });

      if (response.ok) {
        const data = await response.json();
        setAuthorized(data.hasPermission);
      } else {
        setAuthorized(false);
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [projectId, resource, action]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (!loading && !authorized && redirectTo) {
      router.push(redirectTo);
    }
  }, [loading, authorized, redirectTo, router]);

  return {
    loading,
    authorized,
    fallback: !loading && !authorized ? fallback : null,
  };
}

/**
 * Custom hook for checking if user has a specific role in a project
 * @param projectId The ID of the current project
 * @param minRole The minimum required role
 */
export function useHasRole(projectId?: string, minRole?: string) {
  const [loading, setLoading] = useState(true);
  const [hasRole, setHasRole] = useState(false);

  const checkRole = useCallback(async () => {
    if (!projectId || !minRole) {
      setLoading(false);
      setHasRole(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/auth/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minRole }),
      });

      if (response.ok) {
        const data = await response.json();
        setHasRole(data.hasRole);
      } else {
        setHasRole(false);
      }
    } catch (error) {
      console.error('Error checking role:', error);
      setHasRole(false);
    } finally {
      setLoading(false);
    }
  }, [projectId, minRole]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  return { loading, hasRole };
}