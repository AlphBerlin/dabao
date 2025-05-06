import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from "zod";
import { randomUUID } from "crypto";

// Schema for validating invite data
const InviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"], {
    errorMap: () => ({ message: "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER" }),
  }),
});

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
    include: {
      organization: {
        projects: {
          where: { id: projectId },
          select: { id: true }
        }
      }
    }
  });

  if (!userOrg || userOrg.organization.projects.length === 0) {
    return false;
  }
  
  // Only OWNER and ADMIN can invite users
  return ["OWNER", "ADMIN"].includes(userOrg.role);
}

export async function POST(
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
    
    // Check if user has admin access to this project
    const hasAdminAccess = await verifyAdminAccess(projectId, user.id);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to invite users" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = InviteUserSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;
    
    // Check if the project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, organizationId: true }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
    
    // Check if user is already a member
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { organizationId: project.organizationId }
        }
      }
    });

    if (existingUser && existingUser.organizations.length > 0) {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }
    
    // Check if there's an existing invite
    const existingInvite = await db.projectInvite.findFirst({
      where: { 
        email,
        projectId,
        expires: { gt: new Date() } // Not expired yet
      }
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An active invitation already exists for this email" },
        { status: 409 }
      );
    }

    // Generate invite token and expiration (1 week)
    const token = randomUUID();
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    // Create invite in database
    const invite = await db.projectInvite.create({
      data: {
        email,
        projectId,
        role,
        token,
        expires
      }
    });
    
    // In a real application, you would send an email here with the invite link
    // sendInviteEmail(email, token, project.name, role);
    
    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role
    });
  } catch (error) {
    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}