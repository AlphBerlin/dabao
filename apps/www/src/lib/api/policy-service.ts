import { UserRole } from '@prisma/client';

type RoleAssignment = {
  userId: string;
  role: UserRole;
  domain: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

// Function to get the base URL depending on environment
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser environment (client-side)
    return '';
  }
  // Node.js environment (server-side)
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

/**
 * Get all role assignments for a specific project
 * 
 * @param projectId The ID of the project to get role assignments for
 * @returns Promise with the list of role assignments
 */
export async function getProjectRoleAssignments(projectId: string): Promise<RoleAssignment[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/projects/${projectId}/policies/roles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get role assignments');
    }
    
    const data = await response.json();
    return data.roleAssignments;
  } catch (error) {
    console.error('Error fetching project role assignments:', error);
    throw error;
  }
}

/**
 * Assign a role to a user for a specific project
 * 
 * @param projectId The ID of the project
 * @param userId The ID of the user to assign the role to
 * @param role The role to assign
 * @returns Promise with the created role assignment
 */
export async function assignRoleToUser(
  projectId: string,
  userId: string,
  role: UserRole
): Promise<RoleAssignment> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/projects/${projectId}/policies/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to assign role');
    }
    
    const data = await response.json();
    return data.roleAssignment;
  } catch (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
}

/**
 * Remove a role from a user for a specific project
 * 
 * @param projectId The ID of the project
 * @param userId The ID of the user to remove the role from
 * @param role The role to remove
 * @returns Promise indicating success
 */
export async function removeRoleFromUser(
  projectId: string,
  userId: string,
  role: UserRole
): Promise<{ message: string }> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/projects/${projectId}/policies/roles`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove role');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error removing role from user:', error);
    throw error;
  }
}