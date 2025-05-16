// Database client with project context for enforcing Row Level Security
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

// Create a base client instance
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
};

// Create a global placeholder for the client
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Export the client for standard usage
export const db = globalThis.prisma ?? prismaClientSingleton();

// In development, keep the client instance alive between hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

/**
 * Create a database client with project context
 * This sets PostgreSQL session variables to enforce Row Level Security policies
 */
export async function getProjectDB() {
  // Get project ID from headers
  const headersList = headers();
  const projectId = headersList.get('x-project-id');

  if (!projectId) {
    throw new Error('No project context available');
  }

  try {
    // Set the project context in PostgreSQL session
    await db.$executeRaw`SELECT set_config('jwt.claims.project_id', ${projectId}, true)`;
    
    // Return the client with active context
    return db;
  } catch (error) {
    console.error('Failed to set project context:', error);
    throw new Error('Failed to initialize database with project context');
  }
}

/**
 * Create a database client with project context for use in API routes
 * @param projectId The project ID to use for context
 */
export async function getProjectDBWithId(projectId: string) {
  if (!projectId) {
    throw new Error('Project ID is required');
  }

  try {
    // Set the project context in PostgreSQL session
    await db.$executeRaw`SELECT set_config('jwt.claims.project_id', ${projectId}, true)`;
    
    // Return the client with active context
    return db;
  } catch (error) {
    console.error('Failed to set project context:', error);
    throw new Error('Failed to initialize database with project context');
  }
}
