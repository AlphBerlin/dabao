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

// Mock file upload - in a real implementation, this would upload to cloud storage
async function uploadFileToStorage(file: File, projectId: string): Promise<string> {
  // In a real implementation, this would upload the file to a service like AWS S3, Cloudinary, etc.
  // For now, return a placeholder URL
  return `https://placehold.co/400x400?text=Logo+For+${projectId}`;
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
    
    // Check if user has access to this project
    const hasAccess = await verifyProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const logoFile = formData.get("logo") as File;
    
    if (!logoFile) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!validImageTypes.includes(logoFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PNG, JPEG, SVG, or WebP image." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (logoFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 2MB." },
        { status: 400 }
      );
    }
    
    // Upload the file to storage (S3, Cloudinary, etc.)
    const logoUrl = await uploadFileToStorage(logoFile, projectId);
    
    // Update the project's branding settings with the new logo URL
    const existingSettings = await db.brandingSettings.findUnique({
      where: { projectId },
    });
    
    if (existingSettings) {
      // Update existing settings
      await db.brandingSettings.update({
        where: { projectId },
        data: {
          logo: logoUrl,
        },
      });
    } else {
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
      
      // Create new settings if they don't exist
      await db.brandingSettings.create({
        data: {
          projectId,
          name: project.name,
          logo: logoUrl,
          primaryColor: "#6366F1",
          secondaryColor: "#4F46E5", 
          accentColor: "#F43F5E",
        },
      });
    }
    
    // Return the logo URL
    return NextResponse.json({ logoUrl });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}