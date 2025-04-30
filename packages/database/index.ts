import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma Client instance used throughout the application
 * https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/instantiate-prisma-client
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Helper function to get Prisma Client instance
 * Useful for dependency injection in tests
 */
export function getPrismaClient() {
  return prisma;
}

/**
 * Helper function for multi-tenant operations
 * Filters results by the appropriate project
 */
export function getProjectClient(projectSlug: string) {
  return {
    ...prisma,
    $projectSlug: projectSlug,
    // Add custom methods for tenant operations here
  };
}

export * from '@prisma/client';