import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for reward updates
const rewardUpdateSchema = z.object({
  name: z.string().min(1, "Reward name is required").max(100).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["POINTS", "DISCOUNT", "FREEBIE", "CASH_BACK", "TIER_UPGRADE", "CUSTOM"]).optional(),
  value: z.number().int().min(0).optional(),
  code: z.string().optional().nullable(),
  active: z.boolean().optional(),
  image: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

// Get a specific reward
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, rewardId: string } }
) {
  try {
    const { id: projectId, rewardId } = params;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this project
    const hasAccess = await supabase.rpc('check_user_has_project_access', {
      p_user_id: user.id,
      p_project_id: projectId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Get reward with associated data
    const reward = await db.reward.findUnique({
      where: {
        id: rewardId,
        projectId,
      },
      include: {
        customers: {
          take: 10,
          include: {
            customer: true
          }
        },
        campaigns: {
          take: 10,
          include: {
            campaign: true
          }
        }
      }
    });
    
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Error fetching reward:', error);
    return NextResponse.json({ error: 'Failed to fetch reward' }, { status: 500 });
  }
}

// Update a specific reward
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string, rewardId: string } }
) {
  try {
    const { id: projectId, rewardId } = params;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this project
    const hasAccess = await supabase.rpc('check_user_has_project_access', {
      p_user_id: user.id,
      p_project_id: projectId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if reward exists and belongs to the project
    const existingReward = await db.reward.findUnique({
      where: {
        id: rewardId,
        projectId,
      }
    });
    
    if (!existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = rewardUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { name, description, type, value, code, active, image, expiresAt } = validationResult.data;
    
    // Check if code already exists for this project (if provided and changed)
    if (code && code !== existingReward.code) {
      const duplicateCode = await db.reward.findFirst({
        where: {
          projectId,
          code,
          NOT: {
            id: rewardId
          }
        }
      });
      
      if (duplicateCode) {
        return NextResponse.json({ error: 'Reward code already exists for this project' }, { status: 400 });
      }
    }
    
    // Update the reward
    const updatedReward = await db.reward.update({
      where: {
        id: rewardId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value }),
        ...(code !== undefined && { code }),
        ...(active !== undefined && { active }),
        ...(image !== undefined && { image }),
        ...(expiresAt !== undefined && { 
          expiresAt: expiresAt ? new Date(expiresAt) : null 
        }),
      }
    });

    return NextResponse.json({ reward: updatedReward });
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
  }
}

// Delete a specific reward
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string, rewardId: string } }
) {
  try {
    const { id: projectId, rewardId } = params;
    
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this project
    const hasAccess = await supabase.rpc('check_user_has_project_access', {
      p_user_id: user.id,
      p_project_id: projectId,
    });

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if reward exists and belongs to the project
    const existingReward = await db.reward.findUnique({
      where: {
        id: rewardId,
        projectId,
      }
    });
    
    if (!existingReward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    
    // Delete the reward (will cascade delete related records thanks to our schema)
    await db.reward.delete({
      where: {
        id: rewardId,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
  }
}