import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { AuthTokenService } from '@/lib/services/auth-token-service';

/**
 * DELETE /api/projects/[projectId]/authtokens/[tokenId]
 * Revoke (delete) a specific auth token
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string, tokenId: string } }
) {
  try {
    const { projectId, tokenId } = params;
    
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

    // Check if user has permission to delete auth tokens
    const canDeleteTokens = await PolicyManager.canUserAccessInProject(
      dbUser.id,
      RESOURCE_TYPES.AUTH_TOKEN,
      ACTION_TYPES.DELETE,
      projectId
    );

    if (!canDeleteTokens) {
      return NextResponse.json({ error: 'Insufficient permissions to revoke auth tokens' }, { status: 403 });
    }

    // Verify the token belongs to this project
    const token = await prisma.authToken.findUnique({
      where: { id: tokenId },
      select: { projectId: true }
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    if (token.projectId !== projectId) {
      return NextResponse.json({ 
        error: 'Token does not belong to this project' 
      }, { status: 403 });
    }

    // Revoke the token
    const success = await AuthTokenService.revokeToken(tokenId);

    if (success) {
      return NextResponse.json({ message: 'Auth token revoked successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to revoke auth token' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error revoking auth token:', error);
    return NextResponse.json({ error: 'Failed to revoke auth token' }, { status: 500 });
  }
}