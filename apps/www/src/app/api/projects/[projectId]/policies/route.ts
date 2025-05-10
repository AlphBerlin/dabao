import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { withAuthorization } from '@/lib/middleware/withAuthorization';

// Schema for policy creation
const createPolicySchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  object: z.string().min(1, "Object is required"),
  action: z.string().min(1, "Action is required"),
});

/**
 * GET /api/projects/[projectId]/policies
 * Get all policies for a specific project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Initialize Casbin enforcer
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

    // Check if user has ADMIN or OWNER role for this project
    const canManagePolicies = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.POLICY,
      ACTION_TYPES.READ,
      projectId
    );

    if (!canManagePolicies) {
      return NextResponse.json({ error: 'Insufficient permissions to read policies' }, { status: 403 });
    }

    // Get all policies for this project domain
    const policies = await casbinEnforcer.getFilteredPolicy(projectId);

    // Format policies for API response
    const formattedPolicies = policies.map((policy) => ({
      subject: policy[0],
      object: policy[1],
      action: policy[2],
      domain: policy[3]
    }));

    // Get all role assignments for this project
    const enforcer = await casbinEnforcer.getEnforcer();
    const roleAssignments = await enforcer.getGroupingPolicy();
    
    // Filter by domain/project and format
    const projectRoleAssignments = roleAssignments
      .filter(assignment => assignment[2] === projectId)
      .map(assignment => ({
        user: assignment[0],
        role: assignment[1],
        domain: assignment[2]
      }));

    return NextResponse.json({ 
      policies: formattedPolicies,
      roleAssignments: projectRoleAssignments
    });
  } catch (error) {
    console.error("Error getting policies:", error);
    return NextResponse.json({ error: "Failed to get policies" }, { status: 500 });
  }
}

/**
 * POST /api/projects/[projectId]/policies
 * Create a new policy for a specific project
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Initialize Casbin enforcer
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

    // Check if user has ADMIN or OWNER role for this project
    const canManagePolicies = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.POLICY,
      ACTION_TYPES.CREATE,
      projectId
    );

    if (!canManagePolicies) {
      return NextResponse.json({ error: 'Insufficient permissions to create policies' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createPolicySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Validation error", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { subject, object, action } = validationResult.data;

    // Add policy to Casbin
    const success = await casbinEnforcer.addPolicy(subject, object, action, projectId);

    if (success) {
      return NextResponse.json({ 
        message: "Policy created successfully",
        policy: { subject, object, action, domain: projectId }
      });
    } else {
      return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error creating policy:", error);
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}