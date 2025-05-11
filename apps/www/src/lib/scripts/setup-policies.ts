import { prisma } from '../prisma';
import { ACTION_TYPES, casbinEnforcer, RESOURCE_TYPES } from '../casbin/enforcer';
import { PolicyManager } from '../casbin/policy-manager';
import { UserRole } from '@prisma/client';

/**
 * Initialize Casbin policies for all organizations and projects
 * This script should be run once when setting up the policy-based authorization system,
 * and can also be run when new organizations or projects are created.
 */
export async function setupAllPolicies() {
  try {
    console.log('Initializing Casbin enforcer...');
    // await casbinEnforcer.init();
    
    console.log('Setting up policies for all organizations...');
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          include: {
            user: true
          }
        },
        projects: true
      }
    });
    
    for (const org of organizations) {
      console.log(`Setting up policies for organization: ${org.name} (${org.id})`);
      
      // Setup organization policies
      await PolicyManager.setupOrganizationPolicies(org.id);
      
      // Assign roles to users based on UserOrganization roles
      for (const userOrg of org.users) {
        console.log(`Assigning role ${userOrg.role} to user ${userOrg.userId} for organization ${org.id}`);
        await PolicyManager.assignRoleToUserForOrganization(
          userOrg.userId,
          org.id,
          userOrg.role
        );
      }
      
      // Setup project policies
      for (const project of org.projects) {
        console.log(`Setting up policies for project: ${project.name} (${project.id})`);
        await setupProjectPolicies(project.id);
      }
    }
    
    console.log('All policies initialized successfully.');
  } catch (error) {
    console.error('Error initializing policies:', error);
    throw error;
  }
}

/**
 * Initialize Casbin policies for a specific organization
 * @param organizationId The ID of the organization
 */
export async function setupOrganizationPolicies(organizationId: string) {
  try {
    console.log(`Setting up policies for organization: ${organizationId}`);
    // await casbinEnforcer.init();
    
    // Setup organization policies
    await PolicyManager.setupOrganizationPolicies(organizationId);
    
    // Get all users in the organization
    const usersOrgs = await prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: true
      }
    });
    
    // Assign roles to users based on UserOrganization roles
    for (const userOrg of usersOrgs) {
      console.log(`Assigning role ${userOrg.role} to user ${userOrg.userId} for organization ${organizationId}`);
      await PolicyManager.assignRoleToUserForOrganization(
        userOrg.userId,
        organizationId,
        userOrg.role
      );
    }
    
    // Setup policies for all projects in the organization
    const projects = await prisma.project.findMany({
      where: { organizationId }
    });
    
    for (const project of projects) {
      console.log(`Setting up policies for project: ${project.name} (${project.id})`);
      await setupProjectPolicies(project.id);
    }
    
    console.log(`Organization ${organizationId} policies initialized successfully.`);
  } catch (error) {
    console.error(`Error initializing organization policies for ${organizationId}:`, error);
    throw error;
  }
}

/**
 * Initialize Casbin policies for a specific project
 * @param projectId The ID of the project
 */
export async function setupProjectPolicies(projectId: string) {
  try {
    console.log(`Setting up policies for project: ${projectId}`);
    // await casbinEnforcer.init();
    
    // Get the project with organization details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: {
          include: {
            users: true
          }
        }
      }
    });
    
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // Setup project policies
    await PolicyManager.setupProjectPolicies(projectId);
    
    // Assign roles to users based on their organizational roles
    for (const userOrg of project.organization.users) {
      // By default, users get the same role in projects as they have in the organization
      console.log(`Assigning role ${userOrg.role} to user ${userOrg.userId} for project ${projectId}`);
      await PolicyManager.assignRoleToUserForProject(
        userOrg.userId,
        projectId,
        userOrg.role
      );
    }
    
    console.log(`Project ${projectId} policies initialized successfully.`);
  } catch (error) {
    console.error(`Error initializing project policies for ${projectId}:`, error);
    throw error;
  }
}

/**
 * Migrate existing roles from UserOrganization to Casbin policies
 * This should be run once when migrating from role-based to policy-based authorization
 */
export async function migrateExistingRoles() {
  try {
    console.log('Migrating existing roles to Casbin policies...');
    // await casbinEnforcer.init();
    
    // Migrate organization roles
    const userOrgs = await prisma.userOrganization.findMany({
      include: {
        organization: {
          include: {
            projects: true
          }
        }
      }
    });
    
    for (const userOrg of userOrgs) {
      console.log(`Migrating role ${userOrg.role} for user ${userOrg.userId} in organization ${userOrg.organizationId}`);
      
      // Assign organization role
      await PolicyManager.assignRoleToUserForOrganization(
        userOrg.userId,
        userOrg.organizationId,
        userOrg.role
      );
      
      // Assign same role to all projects in the organization
      for (const project of userOrg.organization.projects) {
        console.log(`Migrating role ${userOrg.role} for user ${userOrg.userId} in project ${project.id}`);
        await PolicyManager.assignRoleToUserForProject(
          userOrg.userId,
          project.id,
          userOrg.role
        );
      }
    }
    
    console.log('Role migration completed successfully.');
  } catch (error) {
    console.error('Error migrating roles:', error);
    throw error;
  }
}

/**
 * Initialize default API token policies
 * Creates standard policy types that can be used for API tokens
 */
export async function setupDefaultTokenPolicies() {
  try {
    console.log('Setting up default token policies...');
    // await casbinEnforcer.init();
    
    // Get all projects
    const projects = await prisma.project.findMany();
    
    for (const project of projects) {
      // Create read-only API policy
      await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, project.id);
      await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, project.id);
      await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, project.id);
      
      // Create read-write API policy
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.CREATE, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.UPDATE, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.REWARD, ACTION_TYPES.CREATE, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.REWARD, ACTION_TYPES.UPDATE, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.CREATE, project.id);
      await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.UPDATE, project.id);
      
      // Create admin API policy
      await casbinEnforcer.addPolicy('api_admin', RESOURCE_TYPES.ALL, ACTION_TYPES.ALL, project.id);
    }
    
    console.log('Default token policies created successfully.');
  } catch (error) {
    console.error('Error setting up default token policies:', error);
    throw error;
  }
}

/**
 * Main function to set up all necessary policies
 */
export async function setupAll() {
  try {
    await setupAllPolicies();
    await setupDefaultTokenPolicies();
    console.log('All policy setup completed successfully.');
  } catch (error) {
    console.error('Error in policy setup:', error);
    throw error;
  }
}