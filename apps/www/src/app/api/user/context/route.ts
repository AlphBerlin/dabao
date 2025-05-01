import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from 'zod';

// Schema for validating the request body
const contextUpdateSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required")
});

/**
 * API route to update the user's organization context
 * This sets the organization ID in the user's session
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = contextUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { organizationId } = validationResult.data;

    // Get user from database with organizations
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        organizations: {
          where: {
            organizationId
          },
          include: {
            organization: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user belongs to the requested organization
    if (dbUser.organizations.length === 0) {
      return NextResponse.json({ 
        error: 'You do not have access to this organization' 
      }, { status: 403 });
    }

    // Set organization ID cookie in response
    const response = NextResponse.json({
      success: true,
      organization: dbUser.organizations[0].organization
    });

    // Set the organization ID cookie
    response.cookies.set('orgId', organizationId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Set the x-org-id header in the response
    response.headers.set('x-org-id', organizationId);

    return response;
  } catch (error) {
    console.error('Error updating user organization context:', error);
    return NextResponse.json({ error: 'Failed to update organization context' }, { status: 500 });
  }
}