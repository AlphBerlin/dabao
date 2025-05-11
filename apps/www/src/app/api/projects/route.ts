import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/utils';
import { setupProjectPolicies } from '@/lib/scripts/setup-policies'; // Import our policy setup function
import { assignRoleToUser } from '@/lib/api/policy-service'; // Import the role assignment function

// Schema for pagination query parameters
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schema for project creation
const projectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(64),
  domain: z.string().max(255).optional(),
  description: z.string().optional(),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional(),
    borderRadius: z.enum(['none', 'rounded', 'rounded-full']).optional(),
    fontSize: z.enum(['sm', 'base', 'lg']).optional(),
  }).optional(),
  preferences: z.object({
    pointsName: z.string().min(1).max(50).optional(),
    pointsAbbreviation: z.string().min(1).max(10).optional(),
    welcomeMessage: z.string().max(500).optional(),
    defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'SGD', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'MYR']).optional(),
    enableReferrals: z.boolean().optional(),
    enableTiers: z.boolean().optional(),
    enableGameification: z.boolean().optional(),
  }).optional(),
});

// Get all projects for the authenticated user with pagination
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters for pagination and filtering
    const url = new URL(req.url);
    let projectStatus = url.searchParams.get('status') || undefined;
    if(projectStatus && ['null','all'].includes(projectStatus)) {
      projectStatus = undefined
    }


    const queryParams = {
      page: url.searchParams.get('page') || '1',
      pageSize: url.searchParams.get('pageSize') || '10',
      search: url.searchParams.get('search') || undefined,
      status: projectStatus,
      sortBy: url.searchParams.get('sortBy') || 'updatedAt',
      sortOrder: url.searchParams.get('sortOrder') || 'desc',
    };
    
    const validatedParams = paginationQuerySchema.safeParse(queryParams);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() }, 
        { status: 400 }
      );
    }
    
    const { page, pageSize, search, status, sortBy, sortOrder } = validatedParams.data;
    
    // Get organization ID from header or cookie
    const orgId = req.headers.get('x-org-id') || req.cookies.get('orgId')?.value;
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }
    
    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        organizations: {
          where: {
            
            organizationId: orgId
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if user has access to the organization
    const userHasAccess = dbUser.organizations.some(org => org.organizationId === orgId);
    
    if (!userHasAccess) {
      return NextResponse.json({ error: 'You do not have access to this organization' }, { status: 403 });
    }

    // Construct the filter with search and status
    const filter: any = { organizationId: orgId };
    
    if (search) {
      filter.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Calculate pagination values
    const skip = (page - 1) * pageSize;
    
    // Determine the sort field and direction
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get total count for pagination info
    const totalProjects = await db.project.count({ where: filter });
    
    // Get project details with pagination
    const projects = await db.project.findMany({
      where: filter,
      include: {
        preferences: true,
      },
      orderBy,
      skip,
      take: pageSize,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalProjects / pageSize);

    return NextResponse.json({
      data: projects,
      meta: {
        total: totalProjects,
        page,
        pageSize,
        totalPages,
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// Create a new project
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from header or cookie
    const orgId = req.headers.get('x-org-id') || req.cookies.get('orgId')?.value;
    
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get user from database with organization access check
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        organizations: {
          where: {
            organizationId: orgId,
            role: { in: ['OWNER', 'ADMIN'] }
          }
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to create projects in this organization
    if (dbUser.organizations.length === 0) {
      return NextResponse.json({ 
        error: 'You do not have permission to create projects in this organization' 
      }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = projectCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    const { name, domain, description, theme, preferences } = validationResult.data;

    // Generate a slug for the project
    const slug = await generateSlug(name);

    // Create project with all related data in a transaction
    const project = await db.$transaction(async (tx) => {
      // Create the project
      const newProject = await tx.project.create({
        data: {
          name,
          slug,
          status: 'draft',
          customDomain: domain || null,
          description: description || null,
          organizationId: orgId,
          active: true,
          theme: theme || {
            primaryColor: '#6366F1', // Default indigo
            secondaryColor: '#EC4899', // Default pink
            borderRadius: 'rounded',
            fontSize: 'base',
          },
          settings: {},
        },
      });

      // Create project preferences
      await tx.projectPreference.create({
        data: {
          projectId: newProject.id,
          pointsName: preferences?.pointsName || 'Points',
          pointsAbbreviation: preferences?.pointsAbbreviation || 'pts',
          welcomeMessage: preferences?.welcomeMessage || `Welcome to ${name}!`,
          defaultCurrency: preferences?.defaultCurrency || 'USD',
          enableReferrals: preferences?.enableReferrals ?? true,
          enableTiers: preferences?.enableTiers ?? false,
          enableGameification: preferences?.enableGameification ?? false,
        },
      });

      return newProject;
    });

    // Set up Casbin policies for the new project
    try {
      await setupProjectPolicies(project.id);
      
      // Assign OWNER role to the user who created the project
      await assignRoleToUser(project.id, dbUser.id, 'OWNER');
      
      console.log(`Role OWNER assigned to user ${dbUser.id} for project ${project.id}`);
    } catch (policyError) {
      console.error('Error setting up policies for new project:', policyError);
      // We don't want to fail project creation if policy setup fails,
      // but we should log the error for investigation
    }

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        role: 'OWNER',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}