import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';

/**
 * DELETE /api/projects/[projectId]/policies/[policyId]
 * Delete a specific policy from Casbin
 * Note: policyId in our case is not a real ID but a composite of subject:object:action
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string, policyId: string } }
) {
  try {
    // Initialize Casbin enforcer
    // await casbinEnforcer.init();

    const { projectId, policyId } = params;
    
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

    // Check if user has permission to delete policies
    const canDeletePolicies = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.POLICY,
      ACTION_TYPES.DELETE,
      projectId
    );

    if (!canDeletePolicies) {
      return NextResponse.json({ error: 'Insufficient permissions to delete policies' }, { status: 403 });
    }

    // policyId is a composite of subject:object:action
    const [subject, object, action] = Buffer.from(policyId, 'base64')
      .toString('utf-8')
      .split(':');

    if (!subject || !object || !action) {
      return NextResponse.json({ error: 'Invalid policy ID format' }, { status: 400 });
    }

    // Remove the policy from Casbin
    const success = await casbinEnforcer.removePolicy(subject, object, action, projectId);

    if (success) {
      return NextResponse.json({ message: 'Policy deleted successfully' });
    } else {
      return NextResponse.json({ error: 'Policy not found or could not be deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting policy:', error);
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  }
}