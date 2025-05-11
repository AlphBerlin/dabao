import { prisma } from '../prisma';
import { randomUUID } from 'crypto';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '../casbin/enforcer';

/**
 * Service for managing AuthTokens with policy-based permissions
 */
export class AuthTokenService {
  /**
   * Create a new AuthToken with specific policy type
   * @param projectId The ID of the project to create the token for
   * @param policyType The policy type for this token (typically a role or custom policy name)
   * @param expiresInDays Optional number of days until token expires (null for never expires)
   * @param userId Optional user ID to associate with this token
   * @returns The created token object
   */
  static async createToken(
    projectId: string,
    policyType: string,
    expiresInDays?: number | null,
    userId?: string
  ) {
    // Generate a secure random token
    const token = `datk_${randomUUID().replace(/-/g, '')}_${Date.now().toString(36)}`;
    
    // Calculate expiration date if provided
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;
    
    // Create the token in the database
    const authToken = await prisma.authToken.create({
      data: {
        token,
        policyPtype: policyType,
        projectId,
        userId,
        expiresAt,
        createdAt: new Date(),
        lastUsedAt: null,
      }
    });
    
    return {
      id: authToken.id,
      token: authToken.token,
      policyType: authToken.policyPtype,
      projectId: authToken.projectId,
      userId: authToken.userId,
      expiresAt: authToken.expiresAt,
    };
  }
  
  /**
   * Get all AuthTokens for a project
   * @param projectId The ID of the project to get tokens for
   * @returns Array of AuthToken objects
   */
  static async getTokensForProject(projectId: string) {
    const tokens = await prisma.authToken.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
    
    return tokens.map(token => ({
      id: token.id,
      token: token.token.substring(0, 8) + '...' + token.token.substring(token.token.length - 4), // Mask the token
      policyType: token.policyPtype,
      projectId: token.projectId,
      userId: token.userId,
      expiresAt: token.expiresAt,
      createdAt: token.createdAt,
      lastUsedAt: token.lastUsedAt
    }));
  }
  
  /**
   * Revoke (delete) an AuthToken
   * @param tokenId The ID of the token to revoke
   * @returns true if revoked, false if not found
   */
  static async revokeToken(tokenId: string) {
    try {
      await prisma.authToken.delete({
        where: { id: tokenId }
      });
      return true;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }
  
  /**
   * Check if an AuthToken has permission to perform an action
   * @param token The token string to check
   * @param resource The resource to check permission for
   * @param action The action to check permission for
   * @param projectId The ID of the project to check permission in
   * @returns true if permitted, false otherwise
   */
  static async checkTokenPermission(
    token: string,
    resource: string,
    action: string,
    projectId: string
  ) {
    // Initialize Casbin enforcer if needed
    await casbinEnforcer.init();
    
    // Get the token from the database
    const authToken = await prisma.authToken.findFirst({
      where: {
        token,
        projectId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    if (!authToken) {
      return false;
    }
    
    // Update last used timestamp
    await prisma.authToken.update({
      where: { id: authToken.id },
      data: { lastUsedAt: new Date() }
    });
    
    // Check if the token's policy type allows the requested action on the resource
    const canAccess = await casbinEnforcer.enforce(
      authToken.policyPtype,
      resource,
      action,
      projectId
    );
    
    return canAccess;
  }
  
  /**
   * Create a predefined policy type for common token use cases
   * @param projectId The ID of the project to create the policy for
   * @param policyName A unique name for this policy
   * @param resources Which resources this policy can access
   * @param actions Which actions this policy can perform
   * @returns true if created, false otherwise
   */
  static async createPolicyType(
    projectId: string,
    policyName: string,
    resources: string[],
    actions: string[]
  ) {
    try {
      // Initialize Casbin enforcer if needed
      await casbinEnforcer.init();
      
      // Add policy for each resource and action combination
      for (const resource of resources) {
        for (const action of actions) {
          await casbinEnforcer.addPolicy(policyName, resource, action, projectId);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error creating policy type:', error);
      return false;
    }
  }
  
  /**
   * Create an AuthToken with a predefined API access policy
   * @param projectId The ID of the project
   * @param apiScope Which API scope: 'read', 'write', or 'admin'
   * @param expiresInDays Optional expiration in days
   * @returns The created token object
   */
  static async createApiToken(
    projectId: string,
    apiScope: 'read' | 'write' | 'admin',
    expiresInDays?: number
  ) {
    const policyName = `api_${apiScope}_${randomUUID().substring(0, 8)}`;
    let resources: string[] = [];
    let actions: string[] = [];
    
    switch (apiScope) {
      case 'read':
        resources = [RESOURCE_TYPES.CUSTOMER, RESOURCE_TYPES.REWARD, RESOURCE_TYPES.CAMPAIGN];
        actions = [ACTION_TYPES.READ];
        break;
      case 'write':
        resources = [RESOURCE_TYPES.CUSTOMER, RESOURCE_TYPES.REWARD, RESOURCE_TYPES.CAMPAIGN];
        actions = [ACTION_TYPES.READ, ACTION_TYPES.CREATE, ACTION_TYPES.UPDATE];
        break;
      case 'admin':
        resources = [RESOURCE_TYPES.ALL];
        actions = [ACTION_TYPES.ALL];
        break;
    }
    
    // Create the policy type
    await this.createPolicyType(projectId, policyName, resources, actions);
    
    // Create the token with this policy
    return this.createToken(projectId, policyName, expiresInDays);
  }
}