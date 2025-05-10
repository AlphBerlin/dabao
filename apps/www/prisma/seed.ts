import { PrismaClient, UserRole } from '@prisma/client';
import { casbinEnforcer, ACTION_TYPES, RESOURCE_TYPES } from '@/lib/casbin/enforcer';
import { PolicyManager } from '@/lib/casbin/policy-manager';

const prisma = new PrismaClient();

/**
 * Seed the database with default policies and rules
 */
async function main() {
  console.log('🌱 Starting seed process...');
  
  // Initialize Casbin enforcer
  console.log('Initializing Casbin enforcer...');
  await casbinEnforcer.init();
  
  // Define default policy patterns
  await seedDefaultPolicies();
  
  console.log('✅ Seed completed successfully!');
}

/**
 * Seed default policy patterns
 */
async function seedDefaultPolicies() {
  console.log('Seeding default policy patterns...');
  
  // Seed default API token policies
  console.log('Seeding default API token policies...');
  
  // API read-only policy
  await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('api_readonly', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, 'default');
  
  // API read-write policy
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.CREATE, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.UPDATE, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.REWARD, ACTION_TYPES.CREATE, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.REWARD, ACTION_TYPES.UPDATE, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.CREATE, 'default');
  await casbinEnforcer.addPolicy('api_readwrite', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.UPDATE, 'default');
  
  // API admin policy
  await casbinEnforcer.addPolicy('api_admin', RESOURCE_TYPES.ALL, ACTION_TYPES.ADMIN, 'default');
  
  // Seed basic role policies for future role assignments
  console.log('Seeding role policies...');
  
  // Organization level roles
  // OWNER role
  await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.ALL, ACTION_TYPES.ADMIN, 'default');
  await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.ADMIN, 'default');
  await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.BILLING, ACTION_TYPES.ADMIN, 'default');
  await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.ADMIN, 'default');
  await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.USER, ACTION_TYPES.ADMIN, 'default');
  await casbinEnforcer.addPolicy('OWNER', RESOURCE_TYPES.POLICY, ACTION_TYPES.ADMIN, 'default');
  
  // ADMIN role
  await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.PROJECT, ACTION_TYPES.ADMIN, 'default');
  await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.USER, ACTION_TYPES.MANAGE, 'default');
  await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.BILLING, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('ADMIN', RESOURCE_TYPES.POLICY, ACTION_TYPES.MANAGE, 'default');
  
  // MEMBER role
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.CREATE, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.UPDATE, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.REWARD, ACTION_TYPES.CREATE, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.REWARD, ACTION_TYPES.UPDATE, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.CREATE, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.UPDATE, 'default');
  await casbinEnforcer.addPolicy('MEMBER', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, 'default');
  
  // VIEWER role
  await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.PROJECT, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.ORGANIZATION, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.CUSTOMER, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.REWARD, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.CAMPAIGN, ACTION_TYPES.READ, 'default');
  await casbinEnforcer.addPolicy('VIEWER', RESOURCE_TYPES.MEMBERSHIP, ACTION_TYPES.READ, 'default');
  
  console.log('Default policies seeded successfully.');
}

main()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });