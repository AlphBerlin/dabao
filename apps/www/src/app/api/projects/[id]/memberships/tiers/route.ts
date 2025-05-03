import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for membership tier creation and updates
const membershipTierSchema = z.object({
  name: z.string().min(1, "Tier name is required").max(50),
  description: z.string().optional(),
  thresholdPoints: z.number().int().min(0, 'Must be a non-negative number'),
  thresholdSpend: z.number().min(0, 'Must be a non-negative number'),
  multiplier: z.number().min(1, 'Multiplier must be at least 1'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6})$/, 'Must be a valid hex color'),
  benefits: z.array(z.string()).optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
    const dbTiers = await db.membershipTier.findMany({
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
    
    // Transform the tiers to match the frontend expected format
    const tiers = dbTiers.map(tier => {
      // Extract benefits list from the JSONB column
      let benefitsList: string[] = [];
      if (tier.benefits && typeof tier.benefits === 'object' && 'list' in tier.benefits) {
        benefitsList = Array.isArray(tier.benefits.list) ? tier.benefits.list : [];
      }

      return {
        id: tier.id,
        name: tier.name,
        description: tier.description || '',
        thresholdPoints: tier.pointsThreshold,
        thresholdSpend: tier.spendThreshold,
        multiplier: tier.pointsMultiplier,
        color: tier.color || '#3B82F6',
        benefits: benefitsList,
        isDefault: tier.isDefault,
        isActive: tier.isActive,
        createdAt: tier.createdAt.toISOString(),
        updatedAt: tier.updatedAt.toISOString(),
        level: tier.level,
        memberCount: tier._count.customerMemberships
      };
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
      thresholdPoints, 
      thresholdSpend,
      multiplier,
      color,
      benefits,
      isDefault,
      isActive
    } = validationResult.data;
    
    // Find the highest level to use for new tier
    const highestTier = await db.membershipTier.findFirst({
      where: { projectId },
      orderBy: { level: 'desc' },
      select: { level: true }
    });
    
    const level = highestTier ? highestTier.level + 1 : 1;

    // If this tier is set as default, make sure other tiers are not default
    if (isDefault) {
      await db.membershipTier.updateMany({
        where: { 
          projectId,
          isDefault: true 
        },
        data: { isDefault: false }
      });
    }
    
    // Create the membership tier
    const tier = await db.membershipTier.create({
      data: {
        projectId,
        name,
        description,
        level,
        pointsThreshold: thresholdPoints,
        spendThreshold: thresholdSpend,
        pointsMultiplier: multiplier,
        benefits: benefits ? { list: benefits } : undefined,
        autoUpgrade: true, // Default value
      }
    });

    // Transform the tier to match the frontend expected format
    const transformedTier = {
      id: tier.id,
      name: tier.name,
      description: tier.description || '',
      thresholdPoints: tier.pointsThreshold,
      thresholdSpend: tier.spendThreshold,
      multiplier: tier.pointsMultiplier,
      color: tier.color || '#3B82F6',
      benefits: benefits || [],
      isDefault: tier.isDefault,
      isActive: tier.isActive,
      createdAt: tier.createdAt.toISOString(),
      updatedAt: tier.updatedAt.toISOString(),
      level: tier.level,
      memberCount: 0
    };

    return NextResponse.json({ tier: transformedTier }, { status: 201 });
  } catch (error) {
    console.error('Error creating membership tier:', error);
    return NextResponse.json({ error: 'Failed to create membership tier' }, { status: 500 });
  }
}