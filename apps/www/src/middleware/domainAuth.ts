// Sample middleware for domain-based authentication and project access control

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Middleware to authenticate requests based on domain and client API key
 * This ensures each domain can only access its own project's data
 */
export async function domainAuthMiddleware(
  req: NextRequest,
  res: NextResponse
) {
  // Extract the hostname from the request
  const hostname = req.headers.get('host') || '';
  
  // Skip middleware for non-API routes if needed
  if (!req.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  try {
    // Check if the domain exists and is associated with a project
    const domain = await db.projectDomain.findUnique({
      where: { domain: hostname },
      include: {
        project: true,
      },
    });

    // If domain not found or not verified, return unauthorized
    if (!domain || !domain.isVerified) {
      return new NextResponse(
        JSON.stringify({ error: 'Domain not recognized' }),
        { status: 401 }
      );
    }

    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');

    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'API key required' }),
        { status: 401 }
      );
    }

    // Check if the API key is valid for this domain
    const client = await db.projectClient.findFirst({
      where: {
        apiKey,
        domainId: domain.id,
        status: 'ACTIVE',
        // Check if not expired
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
    });

    if (!client) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401 }
      );
    }

    // Optional: Check IP whitelist if configured
    const clientIp = req.ip;
    if (client.allowedIPs.length > 0 && clientIp) {
      const isAllowedIp = client.allowedIPs.includes(clientIp) || 
                          client.allowedIPs.includes('*');
      
      if (!isAllowedIp) {
        return new NextResponse(
          JSON.stringify({ error: 'IP address not allowed' }),
          { status: 403 }
        );
      }
    }

    // Update the last_used_at timestamp for the client
    await db.projectClient.update({
      where: { id: client.id },
      data: { lastUsedAt: new Date() }
    });

    // Set project context for downstream middleware and API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-project-id', domain.projectId);
    requestHeaders.set('x-client-id', client.clientId);

    // Continue with the modified request
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return response;
  } catch (error) {
    console.error('Domain authentication error:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Authentication error' }),
      { status: 500 }
    );
  }
}
