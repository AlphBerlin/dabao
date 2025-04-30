import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Create Supabase client
  const res = NextResponse.next();
  
  // Determine the tenant slug from hostname or path
  const hostname = request.headers.get('host') || '';
  
  // Extract tenant from subdomain: coffee-rewards.client.dabao.in
  let projectSlug = '';
  
  // Handle subdomain routing in production
  if (!hostname.includes('localhost')) {
    projectSlug = hostname.split('.')[0];
  } else {
    // For local development, get project from path
    // Path format would be /[projectSlug]/*
    const pathParts = request.nextUrl.pathname.split('/');
    if (pathParts.length > 1 && pathParts[1]) {
      projectSlug = pathParts[1];
    }
  }
  
  // Skip middleware for API and _next routes
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') // Static files
  ) {
    return res;
  }
  
  // No project slug detected, redirect to main site
  if (!projectSlug) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Add tenant information to headers for the API routes to access
  res.headers.set('x-tenant-id', projectSlug);
  
  // return await updateSession(request);
  return res;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes except static files and specific paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};