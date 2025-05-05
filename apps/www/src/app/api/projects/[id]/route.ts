import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { Organization } from '@prisma/client';

// Schema for project updates
const projectUpdateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(64).optional(),
  customDomain: z.string().nullable().optional(),
  active: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  theme: z.record(z.any()).optional(),
});

// Get a specific project by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = (await params).id;

    // Check if user has access to this project
    const hasAccess = await supabase.rpc('check_user_has_project_access', {
      p_user_id: user.id,
      p_project_id: projectId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get project with related data
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        preferences: true,
        rewards: {
          take: 10, // Limit to prevent large payloads
          orderBy: { createdAt: 'desc' }
        },
        customers: {
          take: 10, // Limit to prevent large payloads
          orderBy: { createdAt: 'desc' }
        },
        campaigns: {
          take: 5, // Limit to prevent large payloads
          orderBy: { createdAt: 'desc' },
          include: {
            rewards: {
              include: {
                reward: true
              }
            }
          }
        },
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// Update a specific project by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId =(await params).id;

    // Check if user has access to this project
    const hasAccess = await supabase.rpc('check_user_has_project_access', {
      p_user_id: user.id,
      p_project_id: projectId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = projectUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }

    const { name, customDomain, active, settings, theme } = validationResult.data;

    // Update project
    const updatedProject = await db.project.update({
      where: { id: projectId },
      data: {
        ...(name && { name }),
        ...(customDomain !== undefined && { customDomain }),
        ...(active !== undefined && { active }),
        ...(settings && { settings }),
        ...(theme && { theme }),
      },
      include: {
        preferences: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      project: updatedProject 
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// Delete a specific project by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId =(await params).id;

    // Find the user in the database to check organization ownership
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the project
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        organization: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is owner of the organization that owns this project
    const isOwner = dbUser.organizations.some(
      (userOrg: Organization) => userOrg.organizationId === project.organizationId && userOrg.role === 'OWNER'
    );

    if (!isOwner) {
      return NextResponse.json({ error: 'Only organization owners can delete projects' }, { status: 403 });
    }

    // Delete project (will cascade delete related records thanks to our schema)
    await db.project.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}