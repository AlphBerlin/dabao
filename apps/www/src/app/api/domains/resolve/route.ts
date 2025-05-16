// Domain resolution API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * API handler to resolve a domain to a project
 * Used by the middleware to determine which project to load
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  
  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    // Find domain in the database
    const projectDomain = await db.projectDomain.findUnique({
      where: {
        domain,
        isVerified: true,
      },
      include: {
        project: true
      }
    });
    console.log('Project Domain:', projectDomain);
    
    if (!projectDomain || !projectDomain.project) {
      return NextResponse.json(
        { 
          error: 'Domain not found or not verified',
          domain
        },
        { status: 404 }
      );
    }
    
    // Return the project information
    return NextResponse.json({
      projectId: projectDomain.project.id,
      projectName: projectDomain.project.name,
      projectSlug: projectDomain.project.slug,
      domain: domain,
      branding: projectDomain.project.branding,
    });
    
  } catch (error: any) {
    console.error('Error resolving domain:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to resolve domain',
        message: error.message
      },
      { status: 500 }
    );
  }
}
