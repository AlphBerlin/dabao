import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { z } from "zod";
import { UserRole } from "@prisma/client";

// Schema for role check request
const roleCheckSchema = z.object({
  minRole: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'], {
    errorMap: () => ({ message: "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER" }),
  }),
});

/**
 * POST /api/projects/[projectId]/auth/role
 * Check if the current user has a specific role or higher in a project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = params.projectId;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasRole: false }, { status: 401 });
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ hasRole: false }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = roleCheckSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        hasRole: false,
        error: "Validation error", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { minRole } = validationResult.data;

    // Check if user has the specified role or higher
    const hasRole = await PolicyManager.hasRoleForProject(
      dbUser.id,
      projectId,
      minRole as UserRole
    );

    return NextResponse.json({ hasRole });
  } catch (error) {
    console.error('Error checking role:', error);
    return NextResponse.json({ 
      hasRole: false,
      error: 'Failed to check role' 
    }, { status: 500 });
  }
}