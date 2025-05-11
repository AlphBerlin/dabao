import { newEnforcer } from 'casbin';
import path from 'path';
import fs from 'fs';
import { PrismaAdapter } from 'casbin-prisma-adapter';
import { prisma } from '../prisma';
import type { UserRole } from '@prisma/client';

/**
 * Singleton class for managing the Casbin enforcer
 */
class CasbinEnforcerSingleton {
  private static instance: CasbinEnforcerSingleton;
  private _enforcer: any | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): CasbinEnforcerSingleton {
    if (!CasbinEnforcerSingleton.instance) {
      CasbinEnforcerSingleton.instance = new CasbinEnforcerSingleton();
    }

    return CasbinEnforcerSingleton.instance;
  }

  /**
   * Initialize the enforcer with the model and adapter
   */
  public async init(): Promise<void> {
    if (this.isInitializing) {
      return this.initPromise;
    }

    if (this._enforcer) {
      return Promise.resolve();
    }

    this.isInitializing = true;
    
    try {
      this.initPromise = new Promise(async (resolve, reject) => {
        try {
          // Create the Prisma adapter
          const adapter = await PrismaAdapter.newAdapter({
            prisma,
            tableName: 'CasbinRule',
          });

          // Get the model path - resolving relative to this file
          const modelPath = path.join(__dirname, 'model.conf');
          const modelContent = fs.readFileSync(modelPath, 'utf-8');
          
          // Create the enforcer
          this._enforcer = await newEnforcer(modelContent, adapter);
          
          // Load the policies from the database
          await this._enforcer.loadPolicy();
          console.log('Casbin enforcer initialized successfully');
          
          resolve();
        } catch (error) {
          console.error('Error initializing Casbin enforcer:', error);
          reject(error);
        } finally {
          this.isInitializing = false;
        }
      });
      
      return this.initPromise;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Get the enforcer instance
   */
  public async getEnforcer() {
    if (!this._enforcer) {
      await this.init();
    }
    return this._enforcer;
  }

  /**
   * Check if a subject has permission to perform an action on an object in a specific domain
   */
  public async enforce(
    sub: string,
    obj: string,
    act: string,
    dom: string
  ): Promise<boolean> {
    const enforcer = await this.getEnforcer();
    return enforcer.enforce(sub, obj, act, dom);
  }

  /**
   * Add a policy to allow a subject to perform an action on an object in a specific domain
   */
  public async addPolicy(
    sub: string,
    obj: string,
    act: string,
    dom: string
  ): Promise<boolean> {
    const enforcer = await this.getEnforcer();
    return enforcer.addPolicy(sub, obj, act, dom);
  }

  /**
   * Add a role inheritance in a specific domain
   */
  public async addRoleForUserInDomain(
    user: string,
    role: string,
    domain: string
  ): Promise<boolean> {
    const enforcer = await this.getEnforcer();
    return enforcer.addNamedGroupingPolicy('g', user, role, domain);
  }

  /**
   * Remove a policy
   */
  public async removePolicy(
    sub: string,
    obj: string,
    act: string,
    dom: string
  ): Promise<boolean> {
    const enforcer = await this.getEnforcer();
    return enforcer.removePolicy(sub, obj, act, dom);
  }

  /**
   * Remove a role from a user in a specific domain
   */
  public async removeRoleForUserInDomain(
    user: string,
    role: string,
    domain: string
  ): Promise<boolean> {
    const enforcer = await this.getEnforcer();
    return enforcer.removeNamedGroupingPolicy('g', user, role, domain);
  }

  /**
   * Get all roles for a user in a domain
   */
  public async getRolesForUserInDomain(
    user: string,
    domain: string
  ): Promise<string[]> {
    const enforcer = await this.getEnforcer();
    return enforcer.getRolesForUserInDomain(user, domain);
  }

  /**
   * Get all policies in a specific domain
   */
  public async getFilteredPolicy(domain: string): Promise<string[][]> {
    const enforcer = await this.getEnforcer();
    return enforcer.getFilteredPolicy(3, domain);
  }

  /**
   * Reload all policies from the database
   */
  public async reloadPolicy(): Promise<void> {
    const enforcer = await this.getEnforcer();
    await enforcer.loadPolicy();
  }
}

// Export the singleton instance
export const casbinEnforcer = CasbinEnforcerSingleton.getInstance();

// Define constants for common action types
export const ACTION_TYPES = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Special action for management permissions
  ADMIN: '*', // Wildcard for all actions
};

// Define constants for common resource types
export const RESOURCE_TYPES = {
  PROJECT: 'project',
  ORGANIZATION: 'organization',
  USER: 'user',
  BILLING: 'billing',
  API_TOKEN: 'api_token',
  API_KEY: 'api_key',
  AUDIT_LOG: 'audit_log',
  AUTH_TOKEN: 'auth_token',
  CUSTOMER: 'customer',
  REWARD: 'reward',
  CAMPAIGN: 'campaign',
  MEMBERSHIP: 'membership',
  INTEGRATION: 'integration',
  PROJECT_SETTINGS: 'project_settings',
  POLICY: 'policy',
  ALL: '*', // Wildcard for all resources
};