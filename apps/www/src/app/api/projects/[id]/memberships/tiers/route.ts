import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for membership tier creation and updates
const membershipTierSchema = z.object({
  name: z.string().min(1, "Tier name is required").max(50),
  description: z.string().optional(),
  level: z.number().int().min(1),
  pointsThreshold: z.number().int().min(0).optional().nullable(),
  stampsThreshold: z.number().int().min(0).optional().nullable(),
  spendThreshold: z.number().min(0).optional().nullable(),
  subscriptionFee: z.number().min(0).optional().nullable(),
  benefits: z.record(z.any()).optional(),
  icon: z.string().url().optional(),
  autoUpgrade: z.boolean().optional().default(true),
  pointsMultiplier: z.number().min(1).optional().default(1.0),
});

// Get membership tiers for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
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
    
    // Get membership tiers with count of members
    const tiers = await db.membershipTier.findMany({
      where: { projectId },
      orderBy: { level: 'asc' },
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
    
    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('Error fetching membership tiers:', error);
    return NextResponse.json({ error: 'Failed to fetch membership tiers' }, { status: 500 });
  }
}

// Create a new membership tier
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    
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
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = membershipTierSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { 
      name, 
      description, 
      level, 
      pointsThreshold, 
      stampsThreshold,
      spendThreshold,
      subscriptionFee, 
      benefits, 
      icon,
      autoUpgrade,
      pointsMultiplier
    } = validationResult.data;
    
    // Check if level already exists for this project
    const existingTier = await db.membershipTier.findUnique({
      where: {
        projectId_level: {
          projectId,
          level
        }
      }
    });
    
    if (existingTier) {
      return NextResponse.json({ 
        error: 'A membership tier with this level already exists'
      }, { status: 400 });
    }
    
    // Verify that at least one threshold type is provided
    if (!pointsThreshold && !stampsThreshold && !spendThreshold && !subscriptionFee) {
      return NextResponse.json({ 
        error: 'At least one threshold type (points, stamps, spend) or subscription fee must be provided'
      }, { status: 400 });
    }
    
    // Create the membership tier
    const tier = await db.membershipTier.create({
      data: {
        projectId,
        name,
        description,
        level,
        pointsThreshold,
        stampsThreshold,
        spendThreshold,
        subscriptionFee,
        benefits,
        icon,
        autoUpgrade,
        pointsMultiplier,
      }
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error) {
    console.error('Error creating membership tier:', error);
    return NextResponse.json({ error: 'Failed to create membership tier' }, { status: 500 });
  }
}