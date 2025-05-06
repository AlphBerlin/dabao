import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { hasProjectAccess } from "@/lib/auth/project-access";

// GET handler for retrieving project users
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get the organization ID for this project
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

    // Get users in the organization
    const orgUsers = await db.userOrganization.findMany({
      where: { organizationId: project.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        }
      }
    });

    // Format users for the response
    const formattedUsers = orgUsers.map(ou => ({
      id: ou.user.id,
      name: ou.user.name || 'Unknown User',
      email: ou.user.email,
      role: ou.role,
      status: "active", // You might want to track this separately in the future
      joinedAt: ou.createdAt.toISOString(),
      lastActive: null, // This could be tracked separately
      avatar: ou.user.image,
    }));

    // Also get pending invites
    const pendingInvites = await db.projectInvite.findMany({
      where: {
        projectId,
        expires: { gt: new Date() } // Only active invites
      }
    });

    // Format pending invites as users with pending status
    const pendingUsers = pendingInvites.map(invite => ({
      id: invite.id,
      name: null,
      email: invite.email,
      role: invite.role,
      status: "pending",
      joinedAt: null,
      lastActive: null,
      avatar: null,
    }));

    // Combine active users with pending invites
    const allUsers = [...formattedUsers, ...pendingUsers];

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching project users:", error);
    return NextResponse.json(
      { error: "Failed to fetch project users" },
      { status: 500 }
    );
  }
}