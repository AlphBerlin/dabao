#!/usr/bin/env node

import { setupAll, setupAllPolicies, migrateExistingRoles, setupDefaultTokenPolicies, setupOrganizationPolicies, setupProjectPolicies } from './setup-policies';

async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.error(
      'Please specify a command: \n' +
      '  - all: Setup all policies and defaults\n' +
      '  - setup-all-policies: Setup policies for all orgs and projects\n' +
      '  - migrate-roles: Migrate existing roles to policies\n' +
      '  - setup-default-tokens: Setup default token policies\n' +
      '  - setup-organization: Setup policies for a specific organization\n' +
      '  - setup-project: Setup policies for a specific project'
    );
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'all':
        await setupAll();
        break;
        
      case 'setup-all-policies':
        await setupAllPolicies();
        break;
        
      case 'migrate-roles':
        await migrateExistingRoles();
        break;
        
      case 'setup-default-tokens':
        await setupDefaultTokenPolicies();
        break;
        
      case 'setup-organization':
        const orgId = process.argv[3];
        if (!orgId) {
          console.error('Please specify an organization ID');
          process.exit(1);
        }
        await setupOrganizationPolicies(orgId);
        break;
        
      case 'setup-project':
        const projectId = process.argv[3];
        if (!projectId) {
          console.error('Please specify a project ID');
          process.exit(1);
        }
        await setupProjectPolicies(projectId);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    
    console.log('Command completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error executing command:', error);
    process.exit(1);
  }
}

main();