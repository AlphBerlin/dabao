import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { hasProjectAccess } from "@/lib/auth/project-access";

// Mock file upload - in a real implementation, this would upload to cloud storage
async function uploadFileToStorage(file: File, projectId: string): Promise<string> {
  // In a real implementation, this would upload the file to a service like AWS S3, Cloudinary, etc.
  // For now, return a placeholder URL
  return `https://placehold.co/400x400?text=Mascot+For+${projectId}`;
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
    
    // Check if user has access to this project using the hasProjectAccess helper
    const hasAccess = await hasProjectAccess(projectId, user.id);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const mascotFile = formData.get("mascot") as File;
    
    if (!mascotFile) {
      return NextResponse.json(
        { error: "No mascot file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp", "image/gif"];
    if (!validImageTypes.includes(mascotFile.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PNG, JPEG, SVG, GIF or WebP image." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (mascotFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 2MB." },
        { status: 400 }
      );
    }
    
    // Upload the file to storage (S3, Cloudinary, etc.)
    const mascotUrl = await uploadFileToStorage(mascotFile, projectId);
    
    // Update the project's branding settings with the new mascot URL
    const existingSettings = await db.brandingSettings.findUnique({
      where: { projectId },
    });
    
    if (existingSettings) {
      // Update existing settings
      await db.brandingSettings.update({
        where: { projectId },
        data: {
          mascot: mascotUrl,
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
          mascot: mascotUrl,
          primaryColor: "#6366F1",
          secondaryColor: "#4F46E5", 
          accentColor: "#F43F5E",
        },
      });
    }
    
    // Return the mascot URL
    return NextResponse.json({ mascotUrl });
  } catch (error) {
    console.error("Error uploading mascot:", error);
    return NextResponse.json(
      { error: "Failed to upload mascot" },
      { status: 500 }
    );
  }
}