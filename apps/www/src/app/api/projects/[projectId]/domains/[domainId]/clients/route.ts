// API route for managing clients for a domain

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createProjectClient, getDomainClients } from '@/lib/domains';
import { withAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string, domainId: string } }
) {
  try {
    const { projectId, domainId } = params;
    
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
    
    const clients = await getDomainClients(domainId);
    
    // Remove sensitive data before returning
    const safeClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      description: client.description,
      clientId: client.clientId,
      status: client.status,
      allowedIPs: client.allowedIPs,
      accessScope: client.accessScope,
      expiresAt: client.expiresAt,
      lastUsedAt: client.lastUsedAt,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    }));
    
    return NextResponse.json({
      clients: safeClients
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to get domain clients:', error);
    return NextResponse.json({
      error: 'Failed to get domain clients',
      message: error.message
    }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string, domainId: string } }
) {
  try {
    const { projectId, domainId } = params;
    const { name, description, allowedIPs, accessScope, expiresAt } = await req.json();
    
    if (!name) {
      return NextResponse.json({
        error: 'Client name is required',
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
    
    // Create client with provided details
    const client = await createProjectClient(
      projectId,
      domainId,
      name,
      description || null,
      allowedIPs || ['*'],
      accessScope || { permissions: 'full' },
      expiresAt ? new Date(expiresAt) : null
    );
    
    // Return the full client details (including secret/key) only on creation
    return NextResponse.json({
      client,
      message: 'Client created successfully. Store the clientSecret and apiKey securely - they will not be accessible again.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create client:', error);
    return NextResponse.json({
      error: 'Failed to create client',
      message: error.message
    }, { status: 500 });
  }
}

export const DELETE = withAuth(
  async (req: NextRequest, context: { params: { projectId: string, domainId: string } }) => {
    try {
      const { projectId, domainId } = context.params;
      const { clientId } = req.nextUrl.searchParams;
      
      if (!clientId) {
        return NextResponse.json({
          error: 'Client ID is required',
        }, { status: 400 });
      }
      
      // Check if the client exists and belongs to the domain and project
      const client = await db.projectClient.findFirst({
        where: {
          id: clientId,
          domainId,
          projectId
        }
      });
      
      if (!client) {
        return NextResponse.json({
          error: 'Client not found or does not belong to this domain/project',
        }, { status: 404 });
      }
      
      // Delete the client
      await db.projectClient.delete({
        where: {
          id: clientId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: 'Client deleted successfully'
      }, { status: 200 });
    } catch (error: any) {
      console.error('Failed to delete client:', error);
      return NextResponse.json({
        error: 'Failed to delete client',
        message: error.message
      }, { status: 500 });
    }
  }
);

// Endpoint to update client status or details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string, domainId: string } }
) {
  try {
    const { projectId, domainId } = params;
    const { clientId, status, name, description, allowedIPs, accessScope, expiresAt } = await req.json();
    
    if (!clientId) {
      return NextResponse.json({
        error: 'Client ID is required',
      }, { status: 400 });
    }
    
    // Check if the client exists and belongs to the domain and project
    const client = await db.projectClient.findFirst({
      where: {
        id: clientId,
        domainId,
        projectId
      }
    });
    
    if (!client) {
      return NextResponse.json({
        error: 'Client not found or does not belong to this domain/project',
      }, { status: 404 });
    }
    
    // Update the client with provided details
    const updatedClient = await db.projectClient.update({
      where: {
        id: clientId
      },
      data: {
        status: status !== undefined ? status : undefined,
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        allowedIPs: allowedIPs !== undefined ? allowedIPs : undefined,
        accessScope: accessScope !== undefined ? accessScope : undefined,
        expiresAt: expiresAt !== undefined ? new Date(expiresAt) : undefined
      }
    });
    
    // Return client info without sensitive data
    const safeClient = {
      id: updatedClient.id,
      name: updatedClient.name,
      description: updatedClient.description,
      clientId: updatedClient.clientId,
      status: updatedClient.status,
      allowedIPs: updatedClient.allowedIPs,
      accessScope: updatedClient.accessScope,
      expiresAt: updatedClient.expiresAt,
      lastUsedAt: updatedClient.lastUsedAt,
      createdAt: updatedClient.createdAt,
      updatedAt: updatedClient.updatedAt
    };
    
    return NextResponse.json({
      client: safeClient,
      message: 'Client updated successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update client:', error);
    return NextResponse.json({
      error: 'Failed to update client',
      message: error.message
    }, { status: 500 });
  }
}
