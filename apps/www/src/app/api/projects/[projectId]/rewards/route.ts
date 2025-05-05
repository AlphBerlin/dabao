import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for reward creation and updates
const rewardSchema = z.object({
  name: z.string().min(1, "Reward name is required").max(100),
  description: z.string().optional(),
  type: z.enum(["POINTS", "DISCOUNT", "FREEBIE", "CASH_BACK", "TIER_UPGRADE", "CUSTOM"]),
  value: z.number().int().min(0),
  code: z.string().optional(),
  active: z.boolean().optional().default(true),
  image: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// Get rewards for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    
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
    
    // Parse query parameters for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const activeOnly = url.searchParams.get('active') === 'true';
    
    // Get project rewards
    const rewards = await db.reward.findMany({
      where: { 
        projectId,
        ...(activeOnly ? { active: true } : {})
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    
    // Get total count
    const total = await db.reward.count({
      where: { 
        projectId,
        ...(activeOnly ? { active: true } : {})
      },
    });

    return NextResponse.json({ 
      rewards,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

// Create a new reward for a specific project
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    
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
    const validationResult = rewardSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { name, description, type, value, code, active, image, expiresAt } = validationResult.data;
    
    // Check if code already exists for this project (if provided)
    if (code) {
      const existingReward = await db.reward.findFirst({
        where: {
          projectId,
          code
        }
      });
      
      if (existingReward) {
        return NextResponse.json({ error: 'Reward code already exists for this project' }, { status: 400 });
      }
    }
    
    // Create the reward
    const reward = await db.reward.create({
      data: {
        name,
        projectId,
        description,
        type,
        value,
        code,
        active: active ?? true,
        image,
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      }
    });

    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}