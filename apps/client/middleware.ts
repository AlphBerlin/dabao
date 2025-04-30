import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // Create Supabase client
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
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
  
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  // No project slug detected, redirect to main site
  if (!projectSlug) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Add tenant information to headers for the API routes to access
  res.headers.set('x-tenant-id', projectSlug);
  
  // Check if user is authenticated for protected routes
  if (!session && !request.nextUrl.pathname.startsWith(`/${projectSlug}/auth`)) {
    // Redirect to login page with return URL
    const redirectUrl = new URL(`/${projectSlug}/auth/login`, request.url);
    redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes except static files and specific paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};