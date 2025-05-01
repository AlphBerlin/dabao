import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { generateSlug } from '@/lib/utils';

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

// Get all projects for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all projects the user has access to
    const userProjects = await supabase.rpc('get_user_projects', {
      p_user_id: user.id,
    });

    if (userProjects.error) {
      console.error('Error fetching user projects:', userProjects.error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    const projectIds = userProjects.data.map((p: any) => p.project_id);
    
    // If no projects, return empty array
    if (projectIds.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    // Get project details
    const projects = await db.project.findMany({
      where: {
        id: { in: projectIds },
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          }
        },
        preferences: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return NextResponse.json({
      projects: projects.map(project => ({
        ...project,
        // Add the user's role for each project
        role: userProjects.data.find((p: any) => p.project_id === project.id)?.role || 'VIEWER',
      })),
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

    // Get user from database
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        organizations: {
          include: {
            organization: true,
          },
          where: {
            role: 'OWNER',
          },
        },
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an organization
    if (dbUser.organizations.length === 0) {
      return NextResponse.json({ error: 'You need to create an organization first' }, { status: 400 });
    }

    // Use the first organization where the user is an owner
    const organization = dbUser.organizations[0];

    // Parse and validate request body
    const body = await req.json();
    const validationResult = projectCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
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
          customDomain: domain || null,
          description: description || null,
          organizationId: organization?.id,
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

      // Add the user as an owner of this project
      await supabase.rpc('add_user_project_permissions', {
        p_user_id: user.id,
        p_project_id: newProject.id,
        p_role: 'OWNER',
      });

      return newProject;
    });

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