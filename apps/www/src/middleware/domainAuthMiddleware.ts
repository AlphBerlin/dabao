// Domain-based authentication middleware for Next.js
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Paths that don't require domain authentication
const PUBLIC_PATHS = [
  '/',
  '/signin',
  '/signup',
  '/api/auth',
  '/api/webhooks',
  '/images',
  '/fonts',
  // Add any other public paths that don't require domain authentication
];

// Check if a path should bypass domain authentication
function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(publicPath => path.startsWith(publicPath));
}

/**
 * Middleware to handle domain-based authentication
 * This ensures each domain can only access its own project's data
 */
export async function domainAuthMiddleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  const path = url.pathname;
  
  // Skip middleware for non-API routes and public paths
  if (!path.startsWith('/api') || isPublicPath(path)) {
    return NextResponse.next();
  }

  try {
    // Check for API key in headers
    const authHeader = request.headers.get('authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '');
    
    if (!apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    // First check if this is a valid domain that exists in our system
    const domain = await db.projectDomain.findUnique({
      where: { domain: hostname },
      include: { project: true },
    });

    if (!domain || !domain.isVerified) {
      return new NextResponse(
        JSON.stringify({ error: 'Domain not recognized or not verified' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
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
        JSON.stringify({ error: 'Invalid API key for this domain' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }
    
    // Optional: Check IP restrictions if configured
    const clientIp = request.ip;
    if (client.allowedIPs.length > 0 && !client.allowedIPs.includes('*') && clientIp) {
      if (!client.allowedIPs.includes(clientIp)) {
        return new NextResponse(
          JSON.stringify({ error: 'IP address not allowed' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        );
      }
    }

    // Update last used timestamp
    await db.projectClient.update({
      where: { id: client.id },
      data: { lastUsedAt: new Date() }
    });

    // Set project context for downstream handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-project-id', domain.projectId);
    requestHeaders.set('x-client-id', client.clientId);
    requestHeaders.set('x-domain-id', domain.id);

    // Continue with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  } catch (error: any) {
    console.error('Domain authentication error:', error);
    
    return new NextResponse(
      JSON.stringify({ error: 'Authentication error', message: error.message }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
