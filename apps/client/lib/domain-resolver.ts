/**
 * Domain resolver utility
 * This module handles domain-to-project mapping and context setting
 */
import { cache } from 'react';
import { headers } from 'next/headers';
import { db } from './db';

/**
 * Interface for project context
 */
export interface ProjectContext {
  id: string;
  name: string;
  slug: string;
  domain: string;
  primaryDomain: string;
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
  };
}

/**
 * Get project ID from domain
 * This is cached for the duration of the request
 */
export const getProjectFromDomain = cache(async (domain: string): Promise<ProjectContext | null> => {
  try {
    // Find the domain in our database
    const projectDomain = await db.projectDomain.findUnique({
      where: {
        domain: domain,
        isVerified: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            branding: true,
          }
        }
      }
    });

    if (!projectDomain || !projectDomain.project) {
      console.warn(`No project found for domain: ${domain}`);
      return null;
    }

    // Find the primary domain for this project
    const primaryDomain = await db.projectDomain.findFirst({
      where: {
        projectId: projectDomain.projectId,
        isPrimary: true,
      }
    });

    return {
      id: projectDomain.project.id,
      name: projectDomain.project.name,
      slug: projectDomain.project.slug,
      domain: domain,
      primaryDomain: primaryDomain?.domain || domain,
      branding: projectDomain.project.branding as any,
    };
  } catch (error) {
    console.error('Error resolving project from domain:', error);
    return null;
  }
});

/**
 * Get project context for the current request
 * This can be used in server components to get the project context
 */
export async function getProjectContext(): Promise<ProjectContext | null> {
  const headersList = headers();
  const domain = headersList.get('host') || '';
  
  // Remove port from domain if present
  const normalizedDomain = domain.split(':')[0];
  
  return getProjectFromDomain(normalizedDomain);
}

/**
 * Set database context for the current project
 * This applies RLS policies for the current project
 */
export async function setDatabaseContext(projectId: string) {
  try {
    // Set the project context for Row Level Security
    await db.$executeRawUnsafe(`SET LOCAL "request.project_id" = '${projectId}';`);
    return true;
  } catch (error) {
    console.error('Error setting database context:', error);
    return false;
  }
}
