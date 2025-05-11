import { PrismaClient } from '@prisma/client';
import { casbinEnforcer, RESOURCE_TYPES, ACTION_TYPES } from './enforcer';

const prisma = new PrismaClient();

/**
 * This script populates the casbin_rule table with initial policies
 * Run this once to set up your initial access control policies
 */
async function seedCasbinPolicies() {
  console.log('Seeding Casbin policies...');
  
  try {
    // Initialize the enforcer
    await casbinEnforcer.init();
    const enforcer = await casbinEnforcer.getEnforcer();
    
    // First check if policies already exist to avoid duplicates
    const existingPolicies = await prisma.casbinRule.count();
    if (existingPolicies > 0) {
      console.log(`${existingPolicies} policies already exist. Skipping seeding.`);
      console.log('If you want to reset policies, please delete all records from the casbin_rule table first.');
      return;
    }
    
    // Clear any existing policies (should be none based on the check above)
    await enforcer.clearPolicy();
    
    // Define domains (tenants)
    const domains = ['global', 'tenant1', 'tenant2']; // Add your actual tenant IDs
    
    // --------------------------
    // Role definitions
    // --------------------------
    
    // Global roles (RBAC)
    console.log('Adding global role definitions...');
    await enforcer.addNamedGroupingPolicy('g', 'admin', 'owner', 'global'); // admin inherits owner permissions in global domain
    
    // Tenant-specific role inheritance
    for (const domain of domains) {
      console.log(`Adding role definitions for domain: ${domain}...`);
      await enforcer.addNamedGroupingPolicy('g', 'admin', 'owner', domain); // admin inherits owner permissions
      await enforcer.addNamedGroupingPolicy('g', 'member', 'viewer', domain); // member inherits viewer permissions
    }
    
    // --------------------------
    // Policy definitions (PRBAC)
    // --------------------------
    
    // Global admin permissions
    console.log('Adding global admin permissions...');
    await enforcer.addPolicy('owner', RESOURCE_TYPES.ALL, ACTION_TYPES.ALL, 'global');
    await enforcer.addPolicy('admin', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.MANAGE, 'global');
    await enforcer.addPolicy('admin', RESOURCE_TYPES.PROJECT, ACTION_TYPES.MANAGE, 'global');
    
    // Tenant-specific permissions
    for (const domain of domains) {
      console.log(`Adding permissions for domain: ${domain}...`);
      
      // Owner can do everything in their domain
      await enforcer.addPolicy('owner', RESOURCE_TYPES.ALL, ACTION_TYPES.ALL, domain);
      
      // Admin permissions
      await enforcer.addPolicy('admin', RESOURCE_TYPES.PROJECT_SETTINGS, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.USER, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.POLICY, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.REWARD, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.MANAGE, domain);
      await enforcer.addPolicy('admin', RESOURCE_TYPES.INTEGRATION, ACTION_TYPES.MANAGE, domain);
      
      // Member permissions
      await enforcer.addPolicy('member', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.CREATE, domain);
      await enforcer.addPolicy('member', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('member', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.UPDATE, domain);
      await enforcer.addPolicy('member', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('member', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('member', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('member', RESOURCE_TYPES.AUDIT_LOG, ACTION_TYPES.READ, domain);
      
      // Viewer permissions
      await enforcer.addPolicy('viewer', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('viewer', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('viewer', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, domain);
      await enforcer.addPolicy('viewer', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, domain);
    }
    
    // Save all policies to the database
    await enforcer.savePolicy();
    
    // Count and verify the policies
    const policyCount = await prisma.casbinRule.count();
    console.log(`Successfully seeded ${policyCount} Casbin policies!`);
  } catch (error) {
    console.error('Error seeding Casbin policies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly (not imported)
if (require.main === module) {
  seedCasbinPolicies()
    .then(() => console.log('Policy seeding completed.'))
    .catch(console.error);
}

export { seedCasbinPolicies };