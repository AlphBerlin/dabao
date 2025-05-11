import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import {db} from '@/lib/db';

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
];

// List of API paths that should check for API tokens
const API_PATHS = [
  '/api/projects'
];

/**
 * Initialize policies if not already done
 */
async function initializePoliciesIfNeeded() {
  if (policiesInitialized) return;
  
  try {
    // Initialize default policies
    console.log('Initializing Casbin policies...');

    
    const organizations = await db.organization.findMany();
    for (const org of organizations) {
      await PolicyManager.setupOrganizationPolicies(org.id);
    }

    // Get all projects
    const projects = await db.project.findMany();
    for (const project of projects) {
      await PolicyManager.setupProjectPolicies(project.id);
    }

    policiesInitialized = true;
    console.log('Casbin policies initialized successfully');
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
  
  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Handle API routes that should check for API tokens
  if (API_PATHS.some(path => pathname.startsWith(path))) {
    // If the request includes an Authorization header with a Bearer token,
    // allow it to proceed (actual token validation happens in the API route)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return NextResponse.next();
    }
  }
  
  // Create Supabase client for session management
  const response = NextResponse.next();
  const supabase = await createClient();
  
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // If not authenticated and trying to access a protected route, redirect to login
  if (!session && !PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
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