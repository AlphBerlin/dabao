// filepath: /Users/ajithberlin/alphberlin/repos/dabao.in/dabao/apps/www/src/app/api/system/init-policies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PolicyManager } from '@/lib/casbin/policy-manager';
import { db } from '@/lib/db';

// Flag to track if policies have been initialized
let policiesInitialized = false;

/**
 * API route to initialize Casbin policies
 * This can be called on application startup or manually when needed
 */
export async function GET() {
  if (policiesInitialized) {
    return NextResponse.json({ 
      status: 'skipped', 
      message: 'Policies already initialized in this session' 
    });
  }
  
  try {
    console.log('Initializing Casbin policies...');
    
    // Initialize organizations policies
    const organizations = await db.organization.findMany();
    for (const org of organizations) {
      await PolicyManager.setupOrganizationPolicies(org.id);
    }

    // Initialize projects policies
    const projects = await db.project.findMany();
    for (const project of projects) {
      await PolicyManager.setupProjectPolicies(project.id);
    }

    policiesInitialized = true;
    console.log('Casbin policies initialized successfully');
    
    return NextResponse.json({ 
      status: 'success', 
      message: 'Policies initialized successfully', 
      stats: {
        organizations: organizations.length,
        projects: projects.length
      }
    });
  } catch (error) {
    console.error('Failed to initialize policies:', error);
    return NextResponse.json(
      { status: 'error', message: `Failed to initialize policies: ${error}` },
      { status: 500 }
    );
  }
}