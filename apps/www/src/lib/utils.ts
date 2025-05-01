import { db } from './db';
import { nanoid } from 'nanoid';
/**
 * Generates a URL-friendly slug from a string
 * Ensures the slug is unique by appending a random string if necessary
 */
export async function generateSlug(input: string): Promise<string> {
  // Convert to lowercase and replace spaces/special chars with dashes
  let baseSlug = input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // If slug is empty after cleaning, use a fallback
  if (!baseSlug) {
    baseSlug = 'project';
  }

  // Try to use the base slug first
  let slug = baseSlug;
  let counter = 0;
  
  // Check if slug exists in database, if so, append a counter
  while (true) {
    const existingProject = await db.project.findFirst({
      where: { slug },
    });

    if (!existingProject) {
      break;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

/**
 * Generates a random string ID of specified length
 */
export function generateId(length: number = 8): string {
  return nanoid(length);
}

/**
 * Formats a date with standardized options
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric', 
    year: 'numeric',
  });
}

/**
 * Formats a datetime with standardized options
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a relative time string (e.g. "5 minutes ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  
  // Default to formatted date
  return formatDate(d);
}
