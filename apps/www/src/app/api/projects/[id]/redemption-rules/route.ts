import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for redemption rule creation and updates
const redemptionRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required").max(100),
  description: z.string().optional(),
  ruleType: z.enum(["POINTS_TO_VOUCHER", "STAMPS_TO_VOUCHER", "POINTS_TO_PRODUCT", "STAMPS_TO_TIER_UPGRADE"]),
  pointsRequired: z.number().int().min(1).optional(),
  stampsRequired: z.number().int().min(1).optional(),
  outputType: z.enum(["VOUCHER", "PRODUCT", "TIER_UPGRADE"]),
  voucherId: z.string().optional(),
  productId: z.string().optional(),
  tierUpgradeId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

// Get redemption rules for a specific project
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
    
    // Get project redemption rules
    const rules = await db.redemptionRule.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    
    // Get project preferences to determine reward system type
    const preferences = await db.projectPreference.findUnique({
      where: { projectId },
      select: { rewardSystemType: true }
    });

    return NextResponse.json({ 
      rules,
      rewardSystemType: preferences?.rewardSystemType || 'POINTS'
    });
  } catch (error) {
    console.error('Error fetching redemption rules:', error);
    return NextResponse.json({ error: 'Failed to fetch redemption rules' }, { status: 500 });
  }
}

// Create a new redemption rule for a specific project
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
    const validationResult = redemptionRuleSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { 
      name, 
      description, 
      ruleType, 
      pointsRequired, 
      stampsRequired,
      outputType,
      voucherId,
      productId,
      tierUpgradeId,
      isActive
    } = validationResult.data;
    
    // Get project preferences to determine reward system type
    const preferences = await db.projectPreference.findUnique({
      where: { projectId },
      select: { rewardSystemType: true }
    });
    
    // Validate rule type against project reward system type
    if (preferences?.rewardSystemType === "POINTS" && 
        (ruleType === "STAMPS_TO_VOUCHER" || ruleType === "STAMPS_TO_TIER_UPGRADE")) {
      return NextResponse.json({ 
        error: 'This project uses points system. Stamp-based rules are not allowed.' 
      }, { status: 400 });
    }
    
    if (preferences?.rewardSystemType === "STAMPS" && 
        (ruleType === "POINTS_TO_VOUCHER" || ruleType === "POINTS_TO_PRODUCT")) {
      return NextResponse.json({ 
        error: 'This project uses stamps system. Points-based rules are not allowed.' 
      }, { status: 400 });
    }
    
    // Validate required input fields
    if ((ruleType === "POINTS_TO_VOUCHER" || ruleType === "POINTS_TO_PRODUCT") && !pointsRequired) {
      return NextResponse.json({ 
        error: 'Points required must be specified for point-based rules' 
      }, { status: 400 });
    }
    
    if ((ruleType === "STAMPS_TO_VOUCHER" || ruleType === "STAMPS_TO_TIER_UPGRADE") && !stampsRequired) {
      return NextResponse.json({ 
        error: 'Stamps required must be specified for stamp-based rules' 
      }, { status: 400 });
    }
    
    // Validate output type and corresponding ID
    if (outputType === "VOUCHER" && !voucherId) {
      return NextResponse.json({ 
        error: 'Voucher ID must be specified for voucher rewards' 
      }, { status: 400 });
    }
    
    if (outputType === "PRODUCT" && !productId) {
      return NextResponse.json({ 
        error: 'Product ID must be specified for product rewards' 
      }, { status: 400 });
    }
    
    if (outputType === "TIER_UPGRADE" && !tierUpgradeId) {
      return NextResponse.json({ 
        error: 'Tier ID must be specified for tier upgrade rewards' 
      }, { status: 400 });
    }
    
    // Create the redemption rule
    const rule = await db.redemptionRule.create({
      data: {
        projectId,
        name,
        description,
        ruleType,
        pointsRequired,
        stampsRequired,
        outputType,
        voucherId,
        productId,
        tierUpgradeId,
        isActive: isActive ?? true,
      }
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Error creating redemption rule:', error);
    return NextResponse.json({ error: 'Failed to create redemption rule' }, { status: 500 });
  }
}