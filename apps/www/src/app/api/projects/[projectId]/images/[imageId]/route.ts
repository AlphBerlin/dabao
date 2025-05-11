import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { hasProjectAccess } from "@/lib/auth/project-access";
import { deleteImage, getImageById } from "@/lib/services/ai-image.service";
import { db } from "@/lib/db";

// Get single image details
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; imageId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, imageId } = params;
    
    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get image details
    const image = await getImageById(imageId);
    
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    
    // Ensure the image belongs to the correct project
    if (image.id) {
      const imageRecord = await db.aIImage.findUnique({
        where: { id: image.id },
        select: { projectId: true }
      });
      
      if (!imageRecord || imageRecord.projectId !== projectId) {
        return NextResponse.json({ error: "Image not found in this project" }, { status: 404 });
      }
    }
    
    // Return the image details
    return NextResponse.json({ image });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string; imageId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, imageId } = params;
    
    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Check if the image belongs to this project
    const image = await db.aIImage.findUnique({
      where: { id: imageId },
      select: { projectId: true }
    });
    
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    
    if (image.projectId !== projectId) {
      return NextResponse.json(
        { error: "Image not found in this project" },
        { status: 404 }
      );
    }
    
    // Delete the image
    const deleted = await deleteImage(imageId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Failed to delete image", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}