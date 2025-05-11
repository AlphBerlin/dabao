import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { hasProjectAccess } from "@/lib/auth/project-access";
import { getProjectImages } from "@/lib/services/ai-image.service";

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

    // Get pagination parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get project images
    const images = await getProjectImages(projectId, limit, offset);
    
    // Return the images
    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}