/**
 * Convert a data URL to a File object
 * @param dataUrl The data URL string (usually starts with "data:image/...")
 * @param fileName The filename to give the File
 * @param mimeType The MIME type of the file (e.g., "image/png")
 * @returns A File object
 */
export function dataURLtoFile(dataUrl: string, fileName: string, mimeType: string): File {
  // Extract the base64 data from the data URL
  const base64Data = dataUrl.split(',')[1];
  
  // If there's no base64 data, assume it's already a URL and create an empty file
  if (!base64Data) {
    return new File([""], fileName, { type: mimeType });
  }
  
  // Convert base64 to binary
  const binaryStr = atob(base64Data);
  const len = binaryStr.length;
  const arr = new Uint8Array(len);
  
  // Convert binary to Uint8Array
  for (let i = 0; i < len; i++) {
    arr[i] = binaryStr.charCodeAt(i);
  }
  
  // Create and return a File object
  return new File([arr], fileName, { type: mimeType });
}

/**
 * Convert an image File or Blob to a data URL
 * @param file The File or Blob to convert
 * @returns A Promise that resolves to the data URL
 */
export function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a file is an image
 * @param file The file to check
 * @returns Boolean indicating if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Format file size in human-readable format
 * @param bytes The file size in bytes
 * @returns Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}