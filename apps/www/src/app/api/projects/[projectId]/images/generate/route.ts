import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { hasProjectAccess } from "@/lib/auth/project-access";
import { z } from "zod";
import { generateAndSaveImages } from "@/lib/services/ai-image.service";

// Schema for validation
const GenerateImageSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters").max(1000),
  provider: z.enum(["openai", "google", "stability"]).optional().default("openai"),
  size: z.string().optional().default("1024x1024"),
  style: z.string().optional().default("vivid"),
  quality: z.string().optional().default("hd"),
  numberOfImages: z.number().int().min(1).max(4).optional().default(1),
});

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

    const { projectId } = params;
    
    // Check if user has access to this project
    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = GenerateImageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { prompt, provider, size, style, quality, numberOfImages } = validationResult.data;
    
    // Generate and save images
    const savedImages = await generateAndSaveImages({
      prompt,
      provider,
      size,
      style, 
      quality,
      numberOfImages,
      userId: user.id,
      projectId,
    });
    
    // Return the generated images
    return NextResponse.json({
      images: savedImages,
      prompt,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}