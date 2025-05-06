import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../../lib/auth";
import prisma from "../../../../../../../lib/prisma";
import { z } from "zod";

// Schema for validating role update
const UpdateRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"], {
    errorMap: () => ({ message: "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER" }),
  }),
});

// Function to verify admin project access
async function verifyAdminAccess(projectId: string, userId: string) {
  const userOrg = await prisma.userOrganization.findFirst({
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
  
  // Only OWNER and ADMIN can manage user roles
  return ["OWNER", "ADMIN"].includes(userOrg.role);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { projectId: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId, userId } = params;
    
    // Check if user has admin access to this project
    const hasAdminAccess = await verifyAdminAccess(projectId, session.user.id);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to update user roles" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateRoleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { role } = validationResult.data;
    
    // Get the project to find the organization
    const project = await prisma.project.findUnique({
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
    const userOrg = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: project.organizationId
      }
    });

    if (!userOrg) {
      return NextResponse.json(
        { error: "User is not a member of this organization" },
        { status: 404 }
      );
    }

    // Don't allow changing role of the organization owner if you're not the owner
    if (userOrg.role === "OWNER" && session.user.id !== userId) {
      return NextResponse.json(
        { error: "Cannot change the role of the organization owner" },
        { status: 403 }
      );
    }

    // Update the user's role
    const updatedUserOrg = await prisma.userOrganization.update({
      where: { id: userOrg.id },
      data: { role }
    });

    return NextResponse.json({
      id: userId,
      role: updatedUserOrg.role
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}