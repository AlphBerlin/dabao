import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr'
import { createClient } from './lib/supabase/server';

// Configuration for routes that require organization membership
const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/admin',
  '/orders',
  '/profile',
];

// Public routes that should bypass organization check
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/auth',
  '/api',
  '/create-organization',
  '/_next',
  '/favicon.ico',
  '/webhooks/telegram'
];

/**
 * Middleware to check if a user has an organization
 * If not, redirect them to the create-organization page
 */
export async function middleware(request: NextRequest) {
  // First, handle Supabase authentication
  const { pathname } = request.nextUrl;
  
  // Skip organization checks for public routes
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/';
  // For public routes, we can skip organization checks
  if (isPublicRoute) {
    return NextResponse.next();
  }
  // Process Supabase session first
  const supabaseResponse = await updateSession(request);
  
  // If Supabase is redirecting (user not authenticated), follow that redirect
  if (supabaseResponse.headers.has('location')) {
    return supabaseResponse;
  }
  
  
  
  // Check if the route is protected and requires organization membership
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    // Get the Supabase auth cookie to make a server-side authenticated request
    try {
      // Create a Supabase client with the cookies from the request
      const supabase = await createClient();

      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // User not authenticated in Supabase, redirect to login
        return supabaseResponse;
      }
            
      // Check if the user has any organizations
      const userOrgsUrl = new URL('/api/user/organizations', request.url);
      const response = await fetch(userOrgsUrl.toString(), {
        headers: {
          // No need to pass x-user-id, the API will use Supabase auth cookies
          'Cookie': request.headers.get('cookie') || '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user organizations: ${response.status}`);
      }
      
      const organizations = await response.json();
      
      // If the user has no organizations, redirect to create-organization
      if (organizations.length === 0) {
        const createOrgUrl = new URL('/create-organization', request.url);
        
        // Create new response to preserve cookies
        const redirectResponse = NextResponse.redirect(createOrgUrl);
        
        // Copy all cookies from Supabase response to maintain the session
        supabaseResponse.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });
        
        return redirectResponse;
      }
      
      // Handle organization ID propagation
      // Get organization ID from the header or cookie
      let orgId = request.headers.get('x-org-id') || request.cookies.get('orgId')?.value;
      
      // If no organization ID is provided but the user has organizations, use the first one
      if (!orgId && organizations.length > 0) {
        orgId = organizations[0].id;
      }
      
      // Create a new response that we'll modify with the organization ID
      const response1 = NextResponse.next();
      
      // Add the organization ID as a cookie if it's not already there or different
      const currentOrgIdCookie = request.cookies.get('orgId')?.value;
      if (orgId && (!currentOrgIdCookie || currentOrgIdCookie !== orgId)) {
        response1.cookies.set('orgId', orgId, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
      
      // Clone the response from Supabase but add our organization header
      const finalResponse = NextResponse.next({
        request: {
          headers: request.headers,
        },
      });
      
      // Add the x-org-id header to outgoing requests
      if (orgId) {
        finalResponse.headers.set('x-org-id', orgId);
      }
      
      // Copy all cookies from Supabase response
      supabaseResponse.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      
      // Copy any cookies we set in our response
      response1.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      
      return finalResponse;
    } catch (error) {
      console.error('Error in organization middleware:', error);
      // On error, let them proceed but the client-side check will handle redirection
    }
  }
  
  // Return the Supabase response with all cookies intact
  return supabaseResponse;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /fonts, /images (static assets)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};