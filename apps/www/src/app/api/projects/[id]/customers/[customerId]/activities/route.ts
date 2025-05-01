import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for creating customer activities
const activityCreateSchema = z.object({
  type: z.string().min(1).max(50),
  description: z.string().optional(),
  pointsEarned: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
});

// Get activities for a specific customer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string, customerId: string } }
) {
  try {
    const { id: projectId, customerId } = params;
    
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
    
    // Check if customer exists and belongs to the project
    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
        projectId,
      }
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Parse query parameters for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const activityType = url.searchParams.get('type') || undefined;
    
    // Get customer activities with pagination and filtering
    const activities = await db.customerActivity.findMany({
      where: {
        customerId,
        ...(activityType && { type: activityType }),
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    
    // Get total count
    const total = await db.customerActivity.count({
      where: {
        customerId,
        ...(activityType && { type: activityType }),
      },
    });

    return NextResponse.json({ 
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching customer activities:', error);
    return NextResponse.json({ error: 'Failed to fetch customer activities' }, { status: 500 });
  }
}

// Create a new activity for a customer
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, customerId: string } }
) {
  try {
    const { id: projectId, customerId } = params;
    
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
    
    // Check if customer exists and belongs to the project
    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
        projectId,
      }
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = activityCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { type, description, pointsEarned, metadata } = validationResult.data;
    
    // Create the activity
    const activity = await db.customerActivity.create({
      data: {
        customerId,
        type,
        description,
        pointsEarned,
        metadata,
      }
    });

    // Get updated points total
    const pointsTotal = await db.customerActivity.aggregate({
      where: {
        customerId,
        pointsEarned: {
          not: null,
        },
      },
      _sum: {
        pointsEarned: true,
      },
    });
    
    // If this activity earns points and there are available rewards, 
    // check if any point-threshold rewards should be awarded
    if (pointsEarned && pointsEarned > 0) {
      // Find project preferences to get points name for responses
      const projectPreferences = await db.projectPreference.findUnique({
        where: { projectId },
      });
      
      // Get available rewards that are triggered by points thresholds
      const availableRewards = await db.$transaction(async (tx) => {
        // Find active rewards for this project that have metadata with pointThreshold
        const rewards = await tx.reward.findMany({
          where: {
            projectId,
            active: true,
          },
        });
        
        // Filter rewards that have point thresholds in their metadata
        return rewards.filter(reward => {
          if (!reward.metadata) return false;
          const meta = reward.metadata as any;
          return meta.pointThreshold && typeof meta.pointThreshold === 'number';
        });
      });
      
      // Check if customer qualifies for any point-threshold rewards
      if (availableRewards.length > 0) {
        const totalPoints = pointsTotal._sum.pointsEarned || 0;
        
        for (const reward of availableRewards) {
          const meta = reward.metadata as any;
          const threshold = meta.pointThreshold as number;
          
          // If customer has reached or exceeded the threshold
          if (totalPoints >= threshold) {
            // Check if customer already has this reward
            const existingReward = await db.customerReward.findFirst({
              where: {
                customerId,
                rewardId: reward.id,
              },
            });
            
            // If not, grant the reward
            if (!existingReward) {
              await db.customerReward.create({
                data: {
                  customerId,
                  rewardId: reward.id,
                  // Set appropriate expiry if the reward has one
                  ...(reward.expiresAt && { expiresAt: reward.expiresAt }),
                },
              });
              
              // Create an activity to track this reward grant
              await db.customerActivity.create({
                data: {
                  customerId,
                  type: 'reward_earned',
                  description: `Earned ${reward.name} for reaching ${threshold} ${projectPreferences?.pointsName || 'points'}`,
                  metadata: {
                    rewardId: reward.id,
                    rewardName: reward.name,
                    pointThreshold: threshold,
                  },
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      activity,
      pointsTotal: pointsTotal._sum.pointsEarned || 0
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer activity:', error);
    return NextResponse.json({ error: 'Failed to create customer activity' }, { status: 500 });
  }
}