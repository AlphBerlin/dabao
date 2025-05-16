// API route for managing project domains

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProjectDomain, verifyDomain, getProjectDomains } from '@/lib/domains';
import { withAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    
    const domains = await getProjectDomains(projectId);
    
    return NextResponse.json({
      domains
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get project domains:', error);
    return NextResponse.json({
      error: 'Failed to get project domains',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { domain, type, isPrimary } = await req.json();
    
    if (!domain || !type) {
      return NextResponse.json({
        error: 'Missing required fields',
      }, { status: 400 });
    }
    
    // Check if domain already exists
    const existingDomain = await db.projectDomain.findUnique({
      where: {
        domain
      }
    });
    
    if (existingDomain) {
      return NextResponse.json({
        error: 'Domain already exists',
      }, { status: 409 });
    }
    
    // For custom domains, validate format
    if (type === 'CUSTOM_DOMAIN') {
      // Simple domain validation - could be more comprehensive
      const isDomainValid = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/.test(domain);
      
      if (!isDomainValid) {
        return NextResponse.json({
          error: 'Invalid domain format',
        }, { status: 400 });
      }
    }
    
    const newDomain = await createProjectDomain(
      projectId,
      domain,
      type,
      isPrimary
    );
    
    return NextResponse.json({
      domain: newDomain
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create project domain:', error);
    return NextResponse.json({
      error: 'Failed to create project domain',
      message: error.message
    }, { status: 500 });
  }
}

export const DELETE = withAuth(
  async (req: NextRequest, context: { params: { projectId: string; domainId: string } }) => {
    try {
      const { domainId } = req.nextUrl.searchParams;
      
      if (!domainId) {
        return NextResponse.json({
          error: 'Domain ID is required',
        }, { status: 400 });
      }
      
      // Check if the domain exists
      const domain = await db.projectDomain.findUnique({
        where: {
          id: domainId
        },
        include: {
          clients: true
        }
      });
      
      if (!domain) {
        return NextResponse.json({
          error: 'Domain not found',
        }, { status: 404 });
      }
      
      // Remove all clients associated with this domain
      if (domain.clients?.length > 0) {
        await db.projectClient.deleteMany({
          where: {
            domainId
          }
        });
      }
      
      // Delete the domain
      await db.projectDomain.delete({
        where: {
          id: domainId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Domain and associated clients deleted successfully'
      }, { status: 200 });
    } catch (error: any) {
      console.error('Failed to delete domain:', error);
      return NextResponse.json({
        error: 'Failed to delete domain',
        message: error.message
      }, { status: 500 });
    }
  }
);

// Endpoint to verify a custom domain
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { domainId, action } = await req.json();
    
    if (!domainId || action !== 'verify') {
      return NextResponse.json({
        error: 'Invalid request',
      }, { status: 400 });
    }
    
    // Verify the domain exists and belongs to the project
    const domain = await db.projectDomain.findFirst({
      where: {
        id: domainId,
        projectId
      }
    });
    
    if (!domain) {
      return NextResponse.json({
        error: 'Domain not found or does not belong to this project',
      }, { status: 404 });
    }
    
    // Already verified
    if (domain.isVerified) {
      return NextResponse.json({
        success: true,
        message: 'Domain is already verified',
        domain
      }, { status: 200 });
    }
    
    // Verify the domain
    const verifiedDomain = await verifyDomain(domainId);
    
    return NextResponse.json({
      success: true,
      message: 'Domain verified successfully',
      domain: verifiedDomain
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to verify domain:', error);
    return NextResponse.json({
      error: 'Failed to verify domain',
      message: error.message
    }, { status: 500 });
  }
}
