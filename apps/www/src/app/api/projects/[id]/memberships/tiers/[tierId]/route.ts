import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for membership tier updates
const membershipTierUpdateSchema = z.object({
  name: z.string().min(1, "Tier name is required").max(50).optional(),
  description: z.string().optional(),
  thresholdPoints: z.number().int().min(0, 'Must be a non-negative number').optional(),
  thresholdSpend: z.number().min(0, 'Must be a non-negative number').optional(),
  multiplier: z.number().min(1, 'Multiplier must be at least 1').optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Must be a valid hex color').optional(),
  benefits: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Get a specific membership tier
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const { id: projectId, tierId } = params;
    
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
    
    // Get the specific tier
    const tier = await db.membershipTier.findUnique({
      where: { 
        id: tierId,
        projectId,
      },
      include: {
        _count: {
          select: {
            customerMemberships: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!tier) {
      return NextResponse.json({ error: 'Membership tier not found' }, { status: 404 });
    }
    
    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Error fetching membership tier:', error);
    return NextResponse.json({ error: 'Failed to fetch membership tier' }, { status: 500 });
  }
}

// Update a membership tier
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const { id: projectId, tierId } = params;
    
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
    
    // Check if the tier exists
    const existingTier = await db.membershipTier.findUnique({
      where: { 
        id: tierId,
        projectId,
      }
    });

    if (!existingTier) {
      return NextResponse.json({ error: 'Membership tier not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = membershipTierUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { 
      name, 
      description, 
      thresholdPoints, 
      thresholdSpend,
      multiplier,
      color,
      benefits,
      isDefault,
      isActive
    } = validationResult.data;

    // If isDefault is true, ensure no other tier is the default
    if (isDefault) {
      await db.membershipTier.updateMany({
        where: { 
          projectId,
          isDefault: true,
          id: { not: tierId }
        },
        data: { isDefault: false }
      });
    }
    
    // Update the membership tier with the new data, mapping fields correctly
    const updatedTier = await db.membershipTier.update({
      where: { id: tierId },
      data: {
        name,
        description,
        pointsThreshold: thresholdPoints,
        spendThreshold: thresholdSpend,
        pointsMultiplier: multiplier,
        color,
        benefits: benefits ? { list: benefits } : undefined,
        isDefault,
        isActive
      }
    });

    return NextResponse.json({ tier: updatedTier });
  } catch (error) {
    console.error('Error updating membership tier:', error);
    return NextResponse.json({ error: 'Failed to update membership tier' }, { status: 500 });
  }
}

// Delete a membership tier
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const { id: projectId, tierId } = params;
    
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
    
    // Check if the tier exists and if it's the default
    const existingTier = await db.membershipTier.findUnique({
      where: { 
        id: tierId,
        projectId,
      }
    });

    if (!existingTier) {
      return NextResponse.json({ error: 'Membership tier not found' }, { status: 404 });
    }

    if (existingTier.isDefault) {
      return NextResponse.json({ 
        error: 'Cannot delete default tier. Please set another tier as default first.' 
      }, { status: 400 });
    }
    
    // Delete the tier
    await db.membershipTier.delete({
      where: { id: tierId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting membership tier:', error);
    return NextResponse.json({ error: 'Failed to delete membership tier' }, { status: 500 });
  }
}