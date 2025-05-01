import { db } from "@/lib/db";

/**
 * Generate a URL-friendly slug from a string
 * @param input The string to create a slug from
 * @param maxLength Maximum length of the slug
 * @returns A URL-friendly slug
 */
export function slugify(input: string, maxLength = 60): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '')          // Trim - from end of text
    .substring(0, maxLength);    // Trim to maxLength
}

/**
 * Generate a unique slug for a project
 * @param name Project name to base the slug on
 * @returns A unique slug for the project
 */
export async function generateSlug(name: string): Promise<string> {
  // Create base slug
  const baseSlug = slugify(name);
  
  // Check if the slug is already in use
  const existingProject = await db.project.findUnique({
    where: { slug: baseSlug },
  });
  
  // If slug is not taken, use it
  if (!existingProject) {
    return baseSlug;
  }
  
  // If slug is taken, append a random string
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomStr}`;
}