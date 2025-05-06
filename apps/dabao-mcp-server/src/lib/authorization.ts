/**
 * Authorization service using Node-Casbin
 */
import { newEnforcer, Enforcer } from 'casbin';
import { PrismaAdapter } from 'casbin-prisma-adapter';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger.js';

// Initialize Prisma client
const prisma = new PrismaClient();

let enforcer: Enforcer;

/**
 * Initialize the Casbin enforcer
 */
export const initEnforcer = async (): Promise<Enforcer> => {
  try {
    if (!enforcer) {
      const adapter = await PrismaAdapter.newAdapter(prisma);
      
      // Load the model and policy from files
      const modelPath = path.resolve(__dirname, '../../config/casbin/model.conf');
      
      enforcer = await newEnforcer(modelPath, adapter);
      
      // Load default policies if no policies exist
      const policies = await enforcer.getPolicy();
      if (policies.length === 0) {
        await loadDefaultPolicies(enforcer);
      }
      
      logger.info('Casbin enforcer initialized');
    }
    
    return enforcer;
  } catch (error) {
    logger.error('Failed to initialize Casbin enforcer', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

/**
 * Load default policies for Casbin enforcer
 * @param enforcer Casbin enforcer instance
 */
const loadDefaultPolicies = async (enforcer: Enforcer): Promise<void> => {
  try {
    // Add basic role definitions
    await enforcer.addPolicy('admin', '*', '*');  // Admin can do anything
    await enforcer.addPolicy('user', 'message', 'read');  // Users can read messages
    await enforcer.addPolicy('user', 'message', 'create');  // Users can create messages
    await enforcer.addPolicy('user', 'profile', 'read');  // Users can read profiles
    await enforcer.addPolicy('user', 'profile', 'update_own');  // Users can update their own profile
    
    // Add role inheritance
    await enforcer.addRoleForUser('admin', 'user');  // Admin inherits user permissions
    
    logger.info('Default policies loaded');
  } catch (error) {
    logger.error('Failed to load default policies', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

/**
 * Check if a user has permission to perform an action on a resource
 * @param userId User ID
 * @param resource Resource being accessed (e.g., 'message', 'user')
 * @param action Action being performed (e.g., 'read', 'create', 'update', 'delete')
 * @returns True if permitted, false otherwise
 */
export const checkPermission = async (
  userId: string,
  resource: string,
  action: string
): Promise<boolean> => {
  try {
    const e = await initEnforcer();
    
    // Get user roles
    const roles = await e.getRolesForUser(userId);
    
    // Check if any role has the required permission
    for (const role of roles) {
      const permitted = await e.enforce(role, resource, action);
      if (permitted) {
        return true;
      }
    }
    
    // Check for direct user permission
    const permitted = await e.enforce(userId, resource, action);
    
    if (!permitted) {
      logger.warn('Permission denied', { userId, resource, action });
    }
    
    return permitted;
  } catch (error) {
    logger.error('Failed to check permission', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      resource,
      action
    });
    return false;
  }
};

/**
 * Assign a role to a user
 * @param userId User ID
 * @param role Role name
 * @returns True if successful, false otherwise
 */
export const assignRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    const e = await initEnforcer();
    await e.addRoleForUser(userId, role);
    logger.info('Role assigned', { userId, role });
    return true;
  } catch (error) {
    logger.error('Failed to assign role', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      role
    });
    return false;
  }
};

/**
 * Remove a role from a user
 * @param userId User ID
 * @param role Role name
 * @returns True if successful, false otherwise
 */
export const removeRole = async (userId: string, role: string): Promise<boolean> => {
  try {
    const e = await initEnforcer();
    await e.deleteRoleForUser(userId, role);
    logger.info('Role removed', { userId, role });
    return true;
  } catch (error) {
    logger.error('Failed to remove role', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      role
    });
    return false;
  }
};

export default {
  initEnforcer,
  checkPermission,
  assignRole,
  removeRole
};