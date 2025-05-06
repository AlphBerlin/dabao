import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from "zod";

// Schema for validating settings update
const UpdateSettingsSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().nullable(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  customDomain: z.string().optional().nullable(),
  settings: z.record(z.any()).optional(),
});

// Function to verify project access
async function verifyProjectAccess(projectId: string, userId: string, requireAdmin = false) {
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
  
  // Check if admin access is required
  if (requireAdmin) {
    return ["OWNER", "ADMIN"].includes(userOrg.role);
  }
  
  return true;
}

// GET handler for retrieving project settings
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
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get project data from database
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        customDomain: true,
        settings: true,
        active: true,
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get project preferences if they exist
    const preferences = await db.projectPreference.findUnique({
      where: { projectId },
    });

    // Combine project data with preferences
    const projectSettings = {
      ...project,
      preferences: preferences || null,
    };

    return NextResponse.json(projectSettings);
  } catch (error) {
    console.error("Error fetching project settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch project settings" },
      { status: 500 }
    );
  }
}

// PATCH handler for updating project settings
export async function PATCH(
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
    const hasAdminAccess = await verifyProjectAccess(projectId, user.id, true);
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to update project settings" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateSettingsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { name, description, slug, customDomain, settings } = validationResult.data;
    
    // Check if slug is already taken by another project
    if (slug) {
      const existingProject = await db.project.findFirst({
        where: {
          slug,
          id: { not: projectId }
        }
      });

      if (existingProject) {
        return NextResponse.json(
          { error: "Slug is already in use by another project" },
          { status: 409 }
        );
      }
    }

    // Check if custom domain is already taken
    if (customDomain) {
      const existingProjectWithDomain = await db.project.findFirst({
        where: {
          customDomain,
          id: { not: projectId }
        }
      });

      if (existingProjectWithDomain) {
        return NextResponse.json(
          { error: "Custom domain is already in use by another project" },
          { status: 409 }
        );
      }
    }

    // Update project settings
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        slug,
        customDomain,
        settings: settings || undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        customDomain: true,
        settings: true,
        active: true,
      }
    });

    // Also update branding name if it exists
    await db.brandingSettings.updateMany({
      where: { projectId },
      data: { name }
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project settings:", error);
    return NextResponse.json(
      { error: "Failed to update project settings" },
      { status: 500 }
    );
  }
}