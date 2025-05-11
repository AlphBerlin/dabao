import { createClient } from './server';

/**
 * Upload a file to a Supabase Storage bucket
 * 
 * @param file - The file to upload
 * @param bucket - The name of the bucket to upload to
 * @param filePath - The path/filename within the bucket
 * @param options - Additional upload options
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string,
  filePath: string,
  options: {
    contentType?: string;
    cacheControl?: string;
    upsert?: boolean;
    public?: boolean;
  } = {}
): Promise<string> {
  // Get Supabase client
  const supabase = await createClient();
  
  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();
  
  // Prepare upload options
  const uploadOptions = {
    contentType: options.contentType || file.type,
    cacheControl: options.cacheControl || '3600',
    upsert: options.upsert || false
  };
  
  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, uploadOptions);
  
  if (error) {
    console.error('Error uploading to Supabase Storage:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
  
  // For public buckets, get a public URL
  if (options.public) {
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return publicUrlData.publicUrl;
  }
  
  // For private buckets, create a signed URL
  const { data: urlData, error: urlError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 60 * 60); // Default 1 hour in seconds
  
  if (urlError) {
    console.error('Error creating signed URL:', urlError);
    throw new Error(`Failed to generate file URL: ${urlError.message}`);
  }
  
  return urlData.signedUrl;
}

/**
 * Generate a unique file path for uploads
 * 
 * @param file - The file being uploaded
 * @param prefix - A prefix path (e.g., 'users/123/')
 * @returns A unique file path
 */
export function generateFilePath(file: File, prefix: string = ''): string {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop() || '';
  const safeName = file.name
    .split('.')[0]
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase();
  
  return `${prefix}${safeName}-${timestamp}.${fileExtension}`;
}

/**
 * Delete a file from Supabase Storage
 * 
 * @param bucket - The bucket name
 * @param filePath - The path to the file within the bucket
 * @returns Boolean indicating success
 */
export async function deleteFile(bucket: string, filePath: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);
  
  if (error) {
    console.error('Error deleting file from Supabase Storage:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
  
  return true;
}