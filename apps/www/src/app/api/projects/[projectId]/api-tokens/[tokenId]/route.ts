import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Function to verify project access
async function verifyProjectAccess(projectId: string, userId: string) {
  const userOrg = await db.userOrganization.findFirst({
    where: {
      userId,
      organization: {
        projects: {
          some: {
            id: projectId,
          },
        },
      },
    },
  });

  if (!userOrg) {
    return false;
  }
  
  return true;
}

// DELETE handler for revoking an API token
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string, tokenId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, tokenId } = await params;
    
    // Check if user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Check if the API key exists and belongs to the specified project
    const apiKey = await db.apiKey.findFirst({
      where: { 
        id: tokenId,
        projectId 
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: "API token not found" },
        { status: 404 }
      );
    }

    // Delete the API key
    await db.apiKey.delete({
      where: { id: tokenId },
    });

    // Return success with no content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error revoking API token:", error);
    return NextResponse.json(
      { error: "Failed to revoke API token" },
      { status: 500 }
    );
  }
}