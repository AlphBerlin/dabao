import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// Flag to track if policies have been initialized
let policiesInitialized = false;

// List of public paths that do not require authentication
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verification',
  '/api/auth',
  '/_next',
  '/static',
  '/favicon.ico',
  '/manifest.json',
  '/images',
  '/'
];
/**
 * Initialize policies if not already done
 * Note: This is now a stub function as Prisma can't run in Edge Runtime
 * Policy initialization should be done via an API route instead
 */
async function initializePoliciesIfNeeded() {
  if (policiesInitialized) return;
  
  try {
    // Since we're in Edge Runtime, we can't use Prisma directly
    // Just mark as initialized to avoid repeated attempts
    policiesInitialized = true;
    console.log('Skipping policy initialization in middleware (Edge Runtime)');
  } catch (error) {
    console.error('Failed to initialize policies:', error);
  }
}

/**
 * Global middleware for authentication and authorization
 */
export async function middleware(request: NextRequest) {
  // Initialize policies on first request
  await initializePoliciesIfNeeded();
  
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return response;
  }
  
  // Create Supabase client for session management
  const supabase = await createClient();
  
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // If not authenticated and trying to access a protected route, redirect to login
  if (!session) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', encodeURIComponent(request.url));
    return NextResponse.redirect(redirectUrl);
  }
  
  // Continue with the request
  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Match all routes except static files and APIs that handle their own auth
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};