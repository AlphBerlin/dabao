import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for customer reward assignments
const customerRewardSchema = z.object({
  rewardId: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schema for reward redemption
const rewardRedemptionSchema = z.object({
  customerRewardId: z.string().min(1),
});

// Get rewards for a specific customer
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
    
    // Parse query parameters for filtering
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    const redeemedOnly = url.searchParams.get('redeemed') === 'true';
    
    // Get customer rewards with filtering
    const customerRewards = await db.customerReward.findMany({
      where: {
        customerId,
        ...(activeOnly && { 
          claimed: false,
          redeemedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }),
        ...(redeemedOnly && { redeemedAt: { not: null } }),
      },
      include: {
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ customerRewards });
  } catch (error) {
    console.error('Error fetching customer rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch customer rewards' }, { status: 500 });
  }
}

// Assign a reward to a customer
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
    const validationResult = customerRewardSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { rewardId, expiresAt, metadata } = validationResult.data;
    
    // Check if the reward exists and belongs to the project
    const reward = await db.reward.findUnique({
      where: {
        id: rewardId,
        projectId,
      }
    });
    
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found or does not belong to this project' }, { status: 404 });
    }
    
    // Check if the reward is active
    if (!reward.active) {
      return NextResponse.json({ error: 'Reward is not active' }, { status: 400 });
    }
    
    // Check if customer already has this reward and it's still active
    const existingActiveReward = await db.customerReward.findFirst({
      where: {
        customerId,
        rewardId,
        claimed: false,
        redeemedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    if (existingActiveReward) {
      return NextResponse.json({ error: 'Customer already has an active instance of this reward' }, { status: 400 });
    }
    
    // Assign the reward to the customer
    const customerReward = await db.customerReward.create({
      data: {
        customerId,
        rewardId,
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
        ...(metadata && { metadata }),
      },
      include: {
        reward: true,
      }
    });
    
    // Create an activity to track this reward assignment
    await db.customerActivity.create({
      data: {
        customerId,
        type: 'reward_assigned',
        description: `Assigned reward: ${reward.name}`,
        metadata: {
          rewardId,
          rewardName: reward.name,
          customerRewardId: customerReward.id,
        },
      }
    });

    return NextResponse.json({ customerReward }, { status: 201 });
  } catch (error) {
    console.error('Error assigning reward to customer:', error);
    return NextResponse.json({ error: 'Failed to assign reward to customer' }, { status: 500 });
  }
}

// Mark a reward as redeemed
export async function PATCH(
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
    const validationResult = rewardRedemptionSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { customerRewardId } = validationResult.data;
    
    // Check if the customer reward exists and belongs to the customer
    const customerReward = await db.customerReward.findUnique({
      where: {
        id: customerRewardId,
        customerId,
      },
      include: {
        reward: true,
      }
    });
    
    if (!customerReward) {
      return NextResponse.json({ error: 'Customer reward not found' }, { status: 404 });
    }
    
    // Check if the reward is already redeemed
    if (customerReward.redeemedAt) {
      return NextResponse.json({ error: 'Reward has already been redeemed' }, { status: 400 });
    }
    
    // Check if the reward is expired
    if (customerReward.expiresAt && customerReward.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Reward has expired' }, { status: 400 });
    }
    
    // Mark the reward as redeemed
    const updatedReward = await db.customerReward.update({
      where: {
        id: customerRewardId,
      },
      data: {
        redeemedAt: new Date(),
      },
      include: {
        reward: true,
      }
    });
    
    // Create an activity to track this reward redemption
    await db.customerActivity.create({
      data: {
        customerId,
        type: 'reward_redeemed',
        description: `Redeemed reward: ${customerReward.reward.name}`,
        metadata: {
          rewardId: customerReward.rewardId,
          rewardName: customerReward.reward.name,
          customerRewardId,
        },
      }
    });

    return NextResponse.json({ customerReward: updatedReward });
  } catch (error) {
    console.error('Error redeeming customer reward:', error);
    return NextResponse.json({ error: 'Failed to redeem customer reward' }, { status: 500 });
  }
}