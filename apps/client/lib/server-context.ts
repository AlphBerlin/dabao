'use server';

import { headers } from 'next/headers';

/**
 * Interface for project context
 */
export interface ProjectContext {
  projectId: string;
  projectSlug: string;
  domain: string;
}

/**
 * Get project context for server components
 * This extracts the values from headers set by middleware
 */
export async function getServerProjectContext(): Promise<ProjectContext | null> {
  const headersList = await headers();
  
  const projectId = headersList.get('x-project-id');
  const projectSlug = headersList.get('x-project-slug');
  const domain = headersList.get('x-domain');
  
  if (!projectId) {
    return null;
  }
  
  return {
    projectId,
    projectSlug: projectSlug || '',
    domain: domain || '',
  };
}
