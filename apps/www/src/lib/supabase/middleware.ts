import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from './server'

/**
 * Updates the user session by checking Supabase authentication
 * Returns a NextResponse that preserves cookies and session state
 */
export async function updateSession(request: NextRequest) {
  // Create a new response object to return
  let response = NextResponse.next({
    request: request,
  })

  // Create Supabase client with cookie handling
  const supabase = await createClient()

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Handle authentication only for non-auth and non-API routes
  // We let the main middleware handle actual redirects for auth
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/create-organization')
  ) {
    // Redirect to login page
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    response = NextResponse.redirect(redirectUrl)
  }

  // Set user-id cookie if user is authenticated
  if (user) {
    response.cookies.set('user-id', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } else {
    response.cookies.delete('user-id')
  }

  return response
}