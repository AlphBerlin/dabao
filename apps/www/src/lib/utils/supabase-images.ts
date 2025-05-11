import { createClient } from '@/lib/supabase/client';

// Storage bucket name for AI-generated images
export const AI_IMAGES_BUCKET = 'ai-images';

/**
 * Get a signed URL for an image in Supabase storage
 * @param storageKey - The storage key (path) of the image
 * @param expiresIn - Expiration time in seconds (default: 60 minutes)
 * @returns Promise with the signed URL
 */
export async function getImageSignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.storage
      .from(AI_IMAGES_BUCKET)
      .createSignedUrl(storageKey, expiresIn);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getImageSignedUrl:', error);
    throw error;
  }
}

/**
 * Download an image directly from Supabase storage
 * @param storageKey - The storage key (path) of the image
 * @param filename - Suggested filename for the download
 */
export async function downloadImage(storageKey: string, filename: string): Promise<void> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.storage
      .from(AI_IMAGES_BUCKET)
      .download(storageKey);
    
    if (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
    
    // Create a download link for the blob
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Error in downloadImage:', error);
    throw error;
  }
}