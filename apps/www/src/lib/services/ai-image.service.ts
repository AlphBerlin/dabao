import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { GenerateImageRequest, generateImages } from '@/lib/api/da-assistant';
import { uploadFile, generateFilePath } from '@/lib/supabase/storage';
import { dataURLtoFile } from '@/lib/utils/file';
import { AI_IMAGES_BUCKET } from '@/lib/utils/supabase-images';

/**
 * Interface for saved AI image data
 */
export interface SavedAIImage {
  id: string;
  prompt: string;
  imageUrl: string;
  storageKey: string; // Added storageKey to make it available in the frontend
  provider: string;
  size?: string;
  style?: string;
  createdAt: Date;
}

/**
 * Generate AI images using the DA Assistant API and save them to Supabase storage
 */
export async function generateAndSaveImages({
  prompt,
  provider = 'openai',
  size = '1024x1024',
  style = 'vivid',
  quality = 'hd',
  numberOfImages = 1,
  userId,
  projectId,
}: GenerateImageRequest & { projectId: string }): Promise<SavedAIImage[]> {
  try {
    // Generate images using DA Assistant API
    const response = await generateImages({
      prompt,
      provider,
      size,
      style,
      quality,
      numberOfImages,
      userId,
    });

    // Process each generated image
    const savedImages = await Promise.all(
      response.images.map(async (image) => {
        // Convert base64 data URL to a file
        const file = dataURLtoFile(
          image.url, 
          `ai-image-${Date.now()}.png`,
          'image/png'
        );

        // Generate a unique file path for the image
        const filePath = generateFilePath(file, `${projectId}/`);
        
        // Upload the file to Supabase storage
        const imageUrl = await uploadFile(file, AI_IMAGES_BUCKET, filePath, {
          contentType: 'image/png',
          upsert: true,
          public: true,
        });

        // Save the image metadata to the database
        const savedImage = await db.aIImage.create({
          data: {
            projectId,
            userId,
            prompt,
            provider: image.provider,
            size: image.size,
            style: image.style,
            imageUrl,
            storageKey: filePath,
            metadata: {
              quality,
              numberOfImages,
              originalResponse: image
            }
          },
        });

        return {
          id: savedImage.id,
          prompt: savedImage.prompt,
          imageUrl: savedImage.imageUrl,
          storageKey: savedImage.storageKey,
          provider: savedImage.provider,
          size: savedImage.size || undefined,
          style: savedImage.style || undefined,
          createdAt: savedImage.createdAt,
        };
      })
    );

    return savedImages;
  } catch (error) {
    console.error('Error generating and saving images:', error);
    throw new Error(`Failed to generate and save images: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get all AI-generated images for a project
 */
export async function getProjectImages(projectId: string, limit = 50, offset = 0): Promise<SavedAIImage[]> {
  const images = await db.aIImage.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return images.map(img => ({
    id: img.id,
    prompt: img.prompt,
    imageUrl: img.imageUrl,
    storageKey: img.storageKey,
    provider: img.provider,
    size: img.size || undefined,
    style: img.style || undefined,
    createdAt: img.createdAt,
  }));
}

/**
 * Get an AI-generated image by ID
 */
export async function getImageById(imageId: string): Promise<SavedAIImage | null> {
  const image = await db.aIImage.findUnique({
    where: { id: imageId },
  });

  if (!image) return null;

  return {
    id: image.id,
    prompt: image.prompt,
    imageUrl: image.imageUrl,
    storageKey: image.storageKey,
    provider: image.provider,
    size: image.size || undefined,
    style: image.style || undefined,
    createdAt: image.createdAt,
  };
}

/**
 * Delete an AI-generated image
 */
export async function deleteImage(imageId: string): Promise<boolean> {
  try {
    // First get the image to get the storage key
    const image = await db.aIImage.findUnique({
      where: { id: imageId },
    });

    if (!image) return false;

    // Delete from storage
    const supabase = await createClient();
    await supabase.storage
      .from(AI_IMAGES_BUCKET)
      .remove([image.storageKey]);

    // Delete from database
    await db.aIImage.delete({
      where: { id: imageId },
    });

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}