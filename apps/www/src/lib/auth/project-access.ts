import { prisma } from "../prisma";
import { UserRole } from "@prisma/client";

/**
 * Checks if a user has access to a specific project
 * @param userId The ID of the user to check
 * @param projectId The ID of the project to check access for
 * @returns Boolean indicating if the user has access to the project
 */
export async function hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
  try {
    // Find the project first
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return false;
    }

    const user = await prisma.user.findUnique({
        where: { supabaseUserId: userId },
        select: { id: true },
    });
    if (!user) {
        return false;
      }
    // Check if the user is a member of the organization that owns the project
    const userOrganization = await prisma.userOrganization.findFirst({
      where: {
        userId:user?.id,
        organizationId: project.organizationId,
      },
    });
    console.log("User organization found:", user?.id, userOrganization);

    return !!userOrganization; // Return true if the user is a member of the organization
  } catch (error) {
    console.error("Error checking project access:", error);
    return false;
  }
}

/**
 * Gets the user's role for a specific project
 * @param userId The ID of the user to check
 * @param projectId The ID of the project to check role for
 * @returns The user's role in the project's organization, or null if no access
 */
export async function getUserProjectRole(userId: string, projectId: string): Promise<UserRole | null> {
  try {
    // Find the project first
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      return null;
    }

    // Get the user's role in the organization
    const userOrganization = await prisma.userOrganization.findFirst({
      where: {
        userId,
        organizationId: project.organizationId,
      },
      select: {
        role: true,
      },
    });

    return userOrganization?.role || null;
  } catch (error) {
    console.error("Error getting user project role:", error);
    return null;
  }
}

/**
 * Checks if a user has a specific role or higher for a project
 * @param userId The ID of the user to check
 * @param projectId The ID of the project to check access for
 * @param minimumRole The minimum role required (higher roles will also pass)
 * @returns Boolean indicating if the user has the required role or higher
 */
export async function hasProjectRole(
  userId: string, 
  projectId: string, 
  minimumRole: UserRole
): Promise<boolean> {
  const userRole = await getUserProjectRole(userId, projectId);
  
  if (!userRole) {
    return false;
  }

  // Define role hierarchy (higher index means higher privilege)
  const roleHierarchy = [UserRole.VIEWER, UserRole.MEMBER, UserRole.ADMIN, UserRole.OWNER];
  const userRoleIndex = roleHierarchy.indexOf(userRole);
  const requiredRoleIndex = roleHierarchy.indexOf(minimumRole);

  return userRoleIndex >= requiredRoleIndex;
}