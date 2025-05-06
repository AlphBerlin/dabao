import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Function to verify admin project access
async function verifyAdminAccess(projectId: string, userId: string) {
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
  
  // Only OWNER and ADMIN can remove users
  return ["OWNER", "ADMIN"].includes(userOrg.role);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; userId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, userId } = await params;
    
    // Check if user has admin access to this project
    const hasAdminAccess = await verifyAdminAccess(projectId, user.id);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to remove users" },
        { status: 403 }
      );
    }

    // Get the project to find the organization
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Find the user in the organization
    const userOrg = await db.userOrganization.findFirst({
      where: {
        userId,
        organizationId: project.organizationId
      }
    });

    if (!userOrg) {
      // Check if it's an invite instead
      const invite = await db.projectInvite.findFirst({
        where: { 
          id: userId,
          projectId
        }
      });

      if (invite) {
        // Delete the invite
        await db.projectInvite.delete({
          where: { id: invite.id }
        });

        return new NextResponse(null, { status: 204 });
      }

      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    // Don't allow removing the organization owner
    if (userOrg.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the organization owner" },
        { status: 403 }
      );
    }

    // Don't allow users to remove themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself from the project" },
        { status: 403 }
      );
    }

    // Remove the user from the organization
    await db.userOrganization.delete({
      where: { id: userOrg.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error removing user:", error);
    return NextResponse.json(
      { error: "Failed to remove user" },
      { status: 500 }
    );
  }
}