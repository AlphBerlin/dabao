import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * Authentication check endpoint that returns user information if authenticated
 */
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json(
      { 
        status: "unauthorized",
        message: "User is not authenticated",
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    )
  }
  
  return NextResponse.json(
    { 
      status: "authenticated",
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  )
}