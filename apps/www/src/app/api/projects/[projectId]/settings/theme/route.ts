import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from "zod";

// Schema for validating theme update
const UpdateThemeSchema = z.object({
  theme: z.record(z.any()),
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

// PATCH handler for updating project theme
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
        { error: "You don't have permission to update project theme" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateThemeSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { theme } = validationResult.data;
    
    // Update project theme
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        theme,
      },
      select: {
        id: true,
        theme: true,
      }
    });

    // If the theme contains primary/secondary/accent colors, update the branding settings as well
    if (theme.colors) {
      const brandingColors = {
        ...(theme.colors.primary && { primaryColor: theme.colors.primary }),
        ...(theme.colors.secondary && { secondaryColor: theme.colors.secondary }),
        ...(theme.colors.accent && { accentColor: theme.colors.accent }),
      };
      
      // Only update if we have colors to update
      if (Object.keys(brandingColors).length > 0) {
        await db.brandingSettings.updateMany({
          where: { projectId },
          data: brandingColors
        });
      }
    }

    return NextResponse.json({
      id: updatedProject.id,
      theme: updatedProject.theme,
    });
  } catch (error) {
    console.error("Error updating project theme:", error);
    return NextResponse.json(
      { error: "Failed to update project theme" },
      { status: 500 }
    );
  }
}