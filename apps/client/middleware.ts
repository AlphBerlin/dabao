import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Create response object
  const res = NextResponse.next();
  
  // Get the hostname from request headers
  const hostname = request.headers.get('host') || '';
  
  // Normalize domain (remove port for localhost)
  const domain = hostname.split(':')[0];
  
  // Skip middleware for static assets and specific paths
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.') // Static files
  ) {
    return res;
  }
  
  // For API routes, we still need to set project context but don't need to redirect
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  // Skip auth redirects for auth-related pages
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/');
  
  // Check if this is the home page (landing page)
  const isHomePage = request.nextUrl.pathname === '/';
  
  try {
    // Make fetch request to domain resolution API
    const domainInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/domains/resolve?domain=${domain}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!domainInfoResponse.ok) {
      console.error('Failed to resolve domain:', domain);
      
      if (isApiRoute) {
        // For API routes, just continue but the API handler will need to check project context
        return res;
      }
      
      // For non-API routes, redirect to error page
      return NextResponse.redirect(new URL('/domain-error', request.url));
    }

    const domainInfo = await domainInfoResponse.json();
    
    if (!domainInfo.projectId) {
      console.error('No project found for domain:', domain);
      
      if (isApiRoute) {
        return res;
      }
      
      return NextResponse.redirect(new URL('/domain-error', request.url));
    }
    
    // Add project context to headers for API routes and server components
    res.headers.set('x-project-id', domainInfo.projectId);
    res.headers.set('x-project-slug', domainInfo.projectSlug || '');
    res.headers.set('x-domain', domain);
    
    // Handle protected routes directly in the middleware
    const protectedRoutes = ['/account', '/orders', '/profile', '/rewards', '/app'];
    const isProtectedRoute = !isAuthRoute && !isApiRoute && protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    // For protected routes, check authentication
    if (isProtectedRoute) {
      // Update the session using Supabase middleware
      // This will handle redirects if no user is found
      return updateSession(request);
    }
    
    // For the home page, check if the user is authenticated and redirect if needed
    if (isHomePage) {
      // Use the updateSession function to check authentication and handle redirect
      // But we need to create a custom handler that redirects to /app instead of login
      const authRedirectURL = new URL('/app', request.url);
      return await updateSession(request, authRedirectURL);
    }
    
    // For unprotected routes, just pass along the project context
    return res;
  } catch (error) {
    console.error('Error in middleware:', error);
    
    // Don't redirect API routes on error
    if (isApiRoute) {
      return res;
    }
    
    // Redirect to error page for other routes
    return NextResponse.redirect(new URL('/domain-error', request.url));
  }
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all routes except static files and specific paths
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
