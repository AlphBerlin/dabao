import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthorization, useHasRole } from '@/hooks/useAuthorization';
import { Spinner } from '@workspace/ui/components/Spinner';

interface AuthorizeProps {
  projectId: string;
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Component for conditionally rendering children based on user permissions
 */
export function Authorize({
  projectId,
  resource,
  action,
  children,
  fallback = null,
  loading = <Spinner size="sm" />
}: AuthorizeProps) {
  const { loading: checking, authorized } = useAuthorization({
    projectId,
    resource,
    action
  });

  if (checking) {
    return <>{loading}</>;
  }

  return authorized ? <>{children}</> : <>{fallback}</>;
}

interface AuthorizeRoleProps {
  projectId: string;
  minRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

/**
 * Component for conditionally rendering children based on user role
 */
export function AuthorizeRole({
  projectId,
  minRole,
  children,
  fallback = null,
  loading = <Spinner size="sm" />
}: AuthorizeRoleProps) {
  const { loading: checking, hasRole } = useHasRole(projectId, minRole);

  if (checking) {
    return <>{loading}</>;
  }

  return hasRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * HOC for protecting pages based on user permissions
 */
export function withPageAuthorization(
  Component: React.ComponentType<any>,
  resource: string,
  action: string,
  redirectTo: string = '/dashboard'
) {
  return function ProtectedPage(props: any) {
    // Get the projectId from props or context
    const projectId = props.projectId || props.params?.projectId;

    const { loading, authorized, fallback } = useAuthorization({
      projectId,
      resource,
      action,
      redirectTo
    });

    if (loading) {
      return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
    }

    if (!authorized) {
      return fallback;
    }

    return <Component {...props} />;
  };
}

/**
 * HOC for protecting pages based on user role
 */
export function withRoleAuthorization(
  Component: React.ComponentType<any>,
  minRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER',
  redirectTo: string = '/dashboard'
) {
  return function ProtectedPage(props: any) {
    // Get the projectId from props or context
    const projectId = props.projectId || props.params?.projectId;
    
    const { loading, hasRole } = useHasRole(projectId, minRole);
    const router = useRouter();

    useEffect(() => {
      if (!loading && !hasRole && redirectTo) {
        router.push(redirectTo);
      }
    }, [loading, hasRole, redirectTo, router]);

    if (loading) {
      return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
    }

    if (!hasRole) {
      return null;
    }

    return <Component {...props} />;
  };
}