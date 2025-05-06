import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { hasProjectAccess } from "@/lib/auth/project-access";
import { z } from "zod";

// Schema for validation
const BrandingSchema = z.object({
  name: z.string(),
  logo: z.string().nullable().optional(),
  favicon: z.string().nullable().optional(),
  mascot: z.string().nullable().optional(),
  customDomain: z.string().nullable().optional(),
  theme: z.object({
    primaryColor: z.string(),
    secondaryColor: z.string(),
    accentColor: z.string(),
  }),
});

// GET handler for branding settings
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
    const hasAccess = await hasProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get branding settings from database
    const brandingSettings = await db.brandingSettings.findUnique({
      where: { projectId },
    });

    // If no branding settings exist yet, create default branding settings
    if (!brandingSettings) {
      // Get project name to use as default branding name
      const project = await db.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }

      // Create default branding settings
      const defaultSettings = await db.brandingSettings.create({
        data: {
          projectId,
          name: project.name,
          logo: null,
          favicon: null,
          mascot: null,
          customDomain: null,
          primaryColor: "#6366F1",
          secondaryColor: "#4F46E5", 
          accentColor: "#F43F5E",
        },
      });

      // Format response to match BrandingSettings interface
      const formattedSettings = {
        id: defaultSettings.id,
        projectId: defaultSettings.projectId,
        name: defaultSettings.name,
        logo: defaultSettings.logo,
        favicon: defaultSettings.favicon,
        mascot: defaultSettings.mascot,
        customDomain: defaultSettings.customDomain,
        theme: {
          primaryColor: defaultSettings.primaryColor,
          secondaryColor: defaultSettings.secondaryColor,
          accentColor: defaultSettings.accentColor,
        },
      };

      return NextResponse.json(formattedSettings);
    }

    // Format existing settings to match BrandingSettings interface
    const formattedSettings = {
      id: brandingSettings.id,
      projectId: brandingSettings.projectId,
      name: brandingSettings.name,
      logo: brandingSettings.logo,
      favicon: brandingSettings.favicon,
      mascot: brandingSettings.mascot,
      customDomain: brandingSettings.customDomain,
      theme: {
        primaryColor: brandingSettings.primaryColor,
        secondaryColor: brandingSettings.secondaryColor,
        accentColor: brandingSettings.accentColor,
      },
    };

    return NextResponse.json(formattedSettings);
  } catch (error) {
    console.error("Error fetching branding settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch branding settings" },
      { status: 500 }
    );
  }
}

// PUT handler for updating branding settings
export async function PUT(
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
    const hasAccess = await hasProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = BrandingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    
    // Check if branding settings exist
    const existingSettings = await db.brandingSettings.findUnique({
      where: { projectId },
    });

    let updatedSettings;
    
    if (existingSettings) {
      // Update existing settings
      updatedSettings = await db.brandingSettings.update({
        where: { projectId },
        data: {
          name: data.name,
          logo: data.logo,
          favicon: data.favicon,
          mascot: data.mascot,
          customDomain: data.customDomain,
          primaryColor: data.theme.primaryColor,
          secondaryColor: data.theme.secondaryColor,
          accentColor: data.theme.accentColor,
        },
      });
    } else {
      // Create new settings if they don't exist
      updatedSettings = await db.brandingSettings.create({
        data: {
          projectId,
          name: data.name,
          logo: data.logo,
          favicon: data.favicon,
          mascot: data.mascot,
          customDomain: data.customDomain,
          primaryColor: data.theme.primaryColor,
          secondaryColor: data.theme.secondaryColor,
          accentColor: data.theme.accentColor,
        },
      });
    }

    // Format response to match BrandingSettings interface
    const formattedSettings = {
      id: updatedSettings.id,
      projectId: updatedSettings.projectId,
      name: updatedSettings.name,
      logo: updatedSettings.logo,
      favicon: updatedSettings.favicon,
      mascot: updatedSettings.mascot,
      customDomain: updatedSettings.customDomain,
      theme: {
        primaryColor: updatedSettings.primaryColor,
        secondaryColor: updatedSettings.secondaryColor,
        accentColor: updatedSettings.accentColor,
      },
    };

    return NextResponse.json(formattedSettings);
  } catch (error) {
    console.error("Error updating branding settings:", error);
    return NextResponse.json(
      { error: "Failed to update branding settings" },
      { status: 500 }
    );
  }
}