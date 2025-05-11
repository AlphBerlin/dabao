import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from './enforcer';
import { UserRole } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * Helper class for managing Casbin policies
 */
export class PolicyManager {
  /**
   * Set up default policies for a new organization
   * @param organizationId The ID of the organization
   */
  static async setupOrganizationPolicies(organizationId: string): Promise<void> {
    // Add policies for OWNER role
    await this.addOwnerPolicies(organizationId);
    
    // Add policies for ADMIN role
    await this.addAdminPolicies(organizationId);
    
    // Add policies for MEMBER role
    await this.addMemberPolicies(organizationId);
    
    // Add policies for VIEWER role
    await this.addViewerPolicies(organizationId);
  }

  /**
   * Set up default policies for a new project
   * @param projectId The ID of the project
   */
  static async setupProjectPolicies(projectId: string): Promise<void> {
    // Get the organization ID for this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Create project-specific policies for each role
    await this.addProjectOwnerPolicies(projectId);
    await this.addProjectAdminPolicies(projectId);
    await this.addProjectMemberPolicies(projectId);
    await this.addProjectViewerPolicies(projectId);
  }

  /**
   * Assign a role to a user for a specific project
   * @param userId The ID of the user
   * @param projectId The ID of the project
   * @param role The role to assign
   */
  static async assignRoleToUserForProject(
    userId: string,
    projectId: string,
    role: UserRole
  ): Promise<boolean> {
    return casbinEnforcer.addRoleForUserInDomain(userId, role, projectId);
  }

  /**
   * Assign a role to a user for an entire organization
   * @param userId The ID of the user
   * @param organizationId The ID of the organization
   * @param role The role to assign
   */
  static async assignRoleToUserForOrganization(
    userId: string,
    organizationId: string,
    role: UserRole
  ): Promise<boolean> {
    return casbinEnforcer.addRoleForUserInDomain(userId, role, organizationId);
  }

  /**
   * Revoke a role from a user for a specific project
   * @param userId The ID of the user
   * @param projectId The ID of the project
   * @param role The role to revoke
   */
  static async revokeRoleFromUserForProject(
    userId: string,
    projectId: string,
    role: UserRole
  ): Promise<boolean> {
    return casbinEnforcer.removeRoleForUserInDomain(userId, role, projectId);
  }

  /**
   * Get all roles for a user in a specific project
   * @param userId The ID of the user
   * @param projectId The ID of the project
   */
  static async getUserRolesForProject(
    userId: string,
    projectId: string
  ): Promise<string[]> {
    return casbinEnforcer.getRolesForUserInDomain(userId, projectId);
  }

  /**
   * Check if a user has a specific role or higher within a project
   * @param userId The ID of the user
   * @param projectId The ID of the project
   * @param minRole The minimum role required
   */
  static async hasRoleForProject(
    userId: string,
    projectId: string,
    minRole: UserRole
  ): Promise<boolean> {
    const roles = await this.getUserRolesForProject(userId, projectId);
    const roleHierarchy = [
      UserRole.VIEWER, 
      UserRole.MEMBER, 
      UserRole.ADMIN, 
      UserRole.OWNER
    ];
    
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    
    // Check if user has any role at or above the minimum required role
    return roles.some(role => {
      const roleIndex = roleHierarchy.indexOf(role as UserRole);
      return roleIndex >= minRoleIndex;
    });
  }

  /**
   * Check if a user can perform an action on a resource in a specific project
   * @param userId The ID of the user
   * @param resource The resource to check access for
   * @param action The action to check
   * @param projectId The ID of the project
   */
  static async canUserAccessInProject(
    userId: string,
    resource: string,
    action: string,
    projectId: string
  ): Promise<boolean> {
    return casbinEnforcer.enforce(userId, resource, action, projectId);
  }

  /**
   * Add OWNER role policies for an organization
   * @param organizationId The ID of the organization
   */
  private static async addOwnerPolicies(organizationId: string): Promise<void> {
    // Owners have full access to all resources in the organization
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.ALL, ACTION_TYPES.ALL, organizationId);
    
    // Extra explicit policies for clarity
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.ALL, organizationId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.BILLING, ACTION_TYPES.ALL, organizationId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.ALL, organizationId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.USER, ACTION_TYPES.ALL, organizationId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.POLICY, ACTION_TYPES.ALL, organizationId);
  }

  /**
   * Add ADMIN role policies for an organization
   * @param organizationId The ID of the organization
   */
  private static async addAdminPolicies(organizationId: string): Promise<void> {
    // Admins can manage most things except billing and organization settings
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.PROJECT, ACTION_TYPES.ALL, organizationId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.USER, ACTION_TYPES.ALL, organizationId);
    
    // Read-only for billing
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.BILLING, ACTION_TYPES.READ, organizationId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.READ, organizationId);
    
    // Admin can manage policies
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.POLICY, ACTION_TYPES.MANAGE, organizationId);
  }

  /**
   * Add MEMBER role policies for an organization
   * @param organizationId The ID of the organization
   */
  private static async addMemberPolicies(organizationId: string): Promise<void> {
    // Members can read organization data
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.READ, organizationId);
    
    // No access to billing
    // No access to manage users
  }

  /**
   * Add VIEWER role policies for an organization
   * @param organizationId The ID of the organization
   */
  private static async addViewerPolicies(organizationId: string): Promise<void> {
    // Viewers have read access to organization data
    await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.READ, organizationId);
    
    // No access to billing
    // No access to manage users or projects
  }

  /**
   * Add OWNER role policies for a project
   * @param projectId The ID of the project
   */
  private static async addProjectOwnerPolicies(projectId: string): Promise<void> {
    // Owners have full access to all resources in the project
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.ALL, ACTION_TYPES.ALL, projectId);
    
    // Explicit policies for project resources
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.USER, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.REWARD, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.API_TOKEN, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.AUTH_TOKEN, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.POLICY, ACTION_TYPES.ALL, projectId);
  }

  /**
   * Add ADMIN role policies for a project
   * @param projectId The ID of the project
   */
  private static async addProjectAdminPolicies(projectId: string): Promise<void> {
    // Admins have full access to most resources in the project except critical settings
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.PROJECT, ACTION_TYPES.UPDATE, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.USER, ACTION_TYPES.MANAGE, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.REWARD, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.API_TOKEN, ACTION_TYPES.ALL, projectId);
    await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.AUTH_TOKEN, ACTION_TYPES.MANAGE, projectId);
  }

  /**
   * Add MEMBER role policies for a project
   * @param projectId The ID of the project
   */
  private static async addProjectMemberPolicies(projectId: string): Promise<void> {
    // Members can perform CRUD on data but not manage users/settings
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.CREATE, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.UPDATE, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.REWARD, ACTION_TYPES.CREATE, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.REWARD, ACTION_TYPES.UPDATE, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.CREATE, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.UPDATE, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.API_TOKEN, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.AUTH_TOKEN, ACTION_TYPES.READ, projectId);
  }

  /**
   * Add VIEWER role policies for a project
   * @param projectId The ID of the project
   */
  private static async addProjectViewerPolicies(projectId: string): Promise<void> {
    // Viewers have read-only access
    await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, projectId);
    await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, projectId);
  }
}