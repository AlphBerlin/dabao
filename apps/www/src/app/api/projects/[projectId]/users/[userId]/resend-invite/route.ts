import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

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

  // Only OWNER and ADMIN can resend invites
  return ["OWNER", "ADMIN"].includes(userOrg.role);
}

export async function POST(
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

    const { projectId, userId } = params;

    // Check if user has admin access to this project
    const hasAdminAccess = await verifyAdminAccess(projectId, session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to resend invites" },
        { status: 403 }
      );
    }

    // Find the invitation
    const invite = await db.projectInvite.findFirst({
      where: {
        id: userId,
        projectId
      }
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Generate new token and update expiration date (1 week from now)
    const token = randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Update the invitation with new token and expiry
    const updatedInvite = await db.projectInvite.update({
      where: { id: invite.id },
      data: {
        token,
        expires
      }
    });

    // In a real application, you would send an email here with the new invite link
    // sendInviteEmail(invite.email, token, projectName, invite.role);

    return NextResponse.json({
      id: updatedInvite.id,
      email: updatedInvite.email,
      message: "Invitation resent successfully"
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}