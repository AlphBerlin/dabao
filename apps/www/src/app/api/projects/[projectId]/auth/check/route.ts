import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { casbinEnforcer } from '@/lib/casbin/enforcer';
import { z } from "zod";

// Schema for permission check request
const permissionCheckSchema = z.object({
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
});

/**
 * POST /api/projects/[projectId]/auth/check
 * Check if the current user has permission to perform an action on a resource
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = (await params).projectId;
    
    // Initialize Casbin enforcer if needed
    // await casbinEnforcer.init();
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasPermission: false }, { status: 401 });
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ hasPermission: false }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = permissionCheckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        hasPermission: false,
        error: "Validation error", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { resource, action } = validationResult.data;

    // Check if user has permission to perform the action on the resource
    const hasPermission = await casbinEnforcer.enforce(
      dbUser.id,
      resource,
      action,
      projectId
    );

    return NextResponse.json({ hasPermission });
  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json({ 
      hasPermission: false,
      error: 'Failed to check permission' 
    }, { status: 500 });
  }
}