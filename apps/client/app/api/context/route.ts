// Project context API for client-side components
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

/**
 * API handler to get the current project context
 * This uses the headers set by the middleware
 */
export async function GET() {
  const headersList = await headers();
  
  // Get project context from headers
  const projectId = headersList.get('x-project-id') || '';
  const projectSlug = headersList.get('x-project-slug') || '';
  const domain = headersList.get('x-domain') || '';
  
  if (!projectId) {
    return NextResponse.json(
      { error: 'No project context available' },
      { status: 404 }
    );
  }

  try {
    const project = await db.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
        theme: true,
      }
    });

    // Return the project context for client-side components
    return NextResponse.json({
      projectId,
      projectSlug,
      domain,
      project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { 
        projectId, 
        projectSlug, 
        domain,
        error: 'Failed to fetch project details' 
      }
    );
}
