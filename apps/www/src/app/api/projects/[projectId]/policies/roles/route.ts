import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { UserRole } from '@prisma/client';

// Schema for role assignment
const assignRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'], {
    errorMap: () => ({ message: "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER" }),
  }),
});

// Schema for role removal
const removeRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'], {
    errorMap: () => ({ message: "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER" }),
  }),
});

/**
 * GET /api/projects/[projectId]/policies/roles
 * Get all role assignments for a specific project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await casbinEnforcer.init();
    
    const projectId = params.projectId;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to read roles
    const canReadRoles = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.USER,
      ACTION_TYPES.READ,
      projectId
    );

    if (!canReadRoles) {
      return NextResponse.json({ error: 'Insufficient permissions to read role assignments' }, { status: 403 });
    }

    // Get the enforcer and fetch grouping policies
    const enforcer = await casbinEnforcer.getEnforcer();
    const roleAssignments = await enforcer.getFilteredGroupingPolicy(2, projectId);
    
    // Format the role assignments for response
    const formattedRoles = await Promise.all(roleAssignments.map(async (assignment) => {
      const userId = assignment[0];
      const role = assignment[1];
      
      // Get user details to include in the response
      const user = await prisma.user.findFirst({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });
      
      return {
        userId,
        role,
        domain: projectId,
        user: user ? {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email
        } : null
      };
    }));
    
    return NextResponse.json({ roleAssignments: formattedRoles });
  } catch (error) {
    console.error('Error getting role assignments:', error);
    return NextResponse.json({ error: 'Failed to get role assignments' }, { status: 500 });
  }
}

/**
 * POST /api/projects/[projectId]/policies/roles
 * Assign a role to a user for a specific project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await casbinEnforcer.init();
    
    const projectId = params.projectId;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to assign roles
    const canAssignRoles = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.USER,
      ACTION_TYPES.MANAGE,
      projectId
    );

    if (!canAssignRoles) {
      return NextResponse.json({ error: 'Insufficient permissions to assign roles' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = assignRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { userId, role } = validationResult.data;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all current roles for the user in this project
    const userRoles = await PolicyManager.getUserRolesForProject(userId, projectId);
    
    // Check if user already has this role
    if (userRoles.includes(role)) {
      return NextResponse.json({ 
        message: `User already has the ${role} role for this project`,
        roleAssignment: { userId, role, domain: projectId }
      });
    }
    
    // If assigning a higher role, remove lower roles first
    await Promise.all(userRoles.map(async (existingRole) => {
      await PolicyManager.revokeRoleFromUserForProject(userId, projectId, existingRole as UserRole);
    }));

    // Assign the role to the user
    const success = await PolicyManager.assignRoleToUserForProject(userId, projectId, role as UserRole);

    if (success) {
      return NextResponse.json({ 
        message: "Role assigned successfully",
        roleAssignment: { userId, role, domain: projectId }
      });
    } else {
      return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
    }
  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json({ error: 'Failed to assign role' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[projectId]/policies/roles
 * Remove a role from a user for a specific project
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await casbinEnforcer.init();
    
    const projectId = params.projectId;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage roles
    const canManageRoles = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.USER,
      ACTION_TYPES.MANAGE,
      projectId
    );

    if (!canManageRoles) {
      return NextResponse.json({ error: 'Insufficient permissions to remove roles' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = removeRoleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { userId, role } = validationResult.data;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Prevent removing the last OWNER role to avoid lockout
    if (role === 'OWNER') {
      // Get all users with OWNER role in this project
      const enforcer = await casbinEnforcer.getEnforcer();
      const owners = await enforcer.getFilteredGroupingPolicy(1, 'OWNER', projectId);
      
      if (owners.length <= 1 && owners.some(owner => owner[0] === userId)) {
        return NextResponse.json({ 
          error: "Cannot remove the last OWNER of the project" 
        }, { status: 400 });
      }
    }

    // Remove the role from the user
    const success = await PolicyManager.revokeRoleFromUserForProject(userId, projectId, role as UserRole);

    if (success) {
      return NextResponse.json({ message: "Role removed successfully" });
    } else {
      return NextResponse.json({ error: "Role assignment not found or could not be removed" }, { status: 404 });
    }
  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json({ error: 'Failed to remove role' }, { status: 500 });
  }
}