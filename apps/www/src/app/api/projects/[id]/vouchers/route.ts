import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for voucher creation and updates
const voucherSchema = z.object({
  name: z.string().min(1, "Voucher name is required").max(100),
  description: z.string().optional(),
  code: z.string().min(3).max(50),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_ITEM"]),
  discountValue: z.number().min(0),
  minimumSpend: z.number().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  perCustomerLimit: z.number().int().min(1).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional().default(true),
  requiredPoints: z.number().int().min(0).optional(),
  requiredStamps: z.number().int().min(0).optional(),
});

// Get vouchers for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = (await params).id;
    
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
    
    // Parse query parameters for pagination and filtering
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const activeOnly = url.searchParams.get('active') === 'true';
    const currentOnly = url.searchParams.get('current') === 'true';
    
    // Get current date for filtering current vouchers
    const now = new Date();
    
    // Build where clause based on filters
    const whereClause: any = { 
      projectId,
      ...(activeOnly ? { isActive: true } : {}),
      ...(currentOnly ? { 
        startDate: { lte: now },
        endDate: { gte: now }
      } : {})
    };
    
    // Get project vouchers
    const vouchers = await db.voucher.findMany({
      where: whereClause,
      orderBy: [
        { endDate: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            redemptions: true
          }
        }
      },
      skip: offset,
      take: limit,
    });
    
    // Get total count
    const total = await db.voucher.count({
      where: whereClause
    });

    return NextResponse.json({ 
      vouchers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

// Create a new voucher for a specific project
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
    const validationResult = voucherSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { 
      name, 
      description, 
      code, 
      discountType, 
      discountValue,
      minimumSpend,
      usageLimit,
      perCustomerLimit,
      startDate,
      endDate,
      isActive,
      requiredPoints,
      requiredStamps
    } = validationResult.data;
    
    // Validate that start date is before end date
    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json({ 
        error: 'Start date must be before end date' 
      }, { status: 400 });
    }
    
    // Check if code already exists for this project
    const existingVoucher = await db.voucher.findUnique({
      where: {
        projectId_code: {
          projectId,
          code
        }
      }
    });
    
    if (existingVoucher) {
      return NextResponse.json({ 
        error: 'Voucher code already exists for this project' 
      }, { status: 400 });
    }
    
    // Verify that either points or stamps requirement is provided based on project preferences
    const projectPreferences = await db.projectPreference.findUnique({
      where: { projectId },
      select: { rewardSystemType: true }
    });
    
    if (projectPreferences?.rewardSystemType === "STAMPS" && requiredPoints) {
      return NextResponse.json({ 
        error: 'This project uses stamps system. Please provide stamps requirement instead of points.' 
      }, { status: 400 });
    }
    
    if (projectPreferences?.rewardSystemType === "POINTS" && requiredStamps) {
      return NextResponse.json({ 
        error: 'This project uses points system. Please provide points requirement instead of stamps.' 
      }, { status: 400 });
    }
    
    // Create the voucher
    const voucher = await db.voucher.create({
      data: {
        projectId,
        name,
        description,
        code,
        discountType,
        discountValue,
        minimumSpend,
        usageLimit,
        perCustomerLimit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? true,
        requiredPoints,
        requiredStamps,
      }
    });

    return NextResponse.json({ voucher }, { status: 201 });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}