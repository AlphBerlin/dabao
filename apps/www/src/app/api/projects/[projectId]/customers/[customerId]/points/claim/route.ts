import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for claiming points
const claimPointsSchema = z.object({
  points: z.number().int().positive(),
  reason: z.string().min(1),
  description: z.string().optional(),
  voucherId: z.string().optional(),
});

// Claim points from a customer's balance
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string, customerId: string } }
) {
  try {
    const { projectId, customerId } = params;
    
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
      },
      include: {
        customerMemberships: true,
      }
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = claimPointsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { points, reason, description, voucherId } = validationResult.data;
    
    // Check if customer has a membership with sufficient points
    const customerMembership = customer.customerMemberships[0];
    if (!customerMembership) {
      return NextResponse.json({ error: 'Customer has no active membership' }, { status: 400 });
    }
    
    if (customerMembership.pointsBalance < points) {
      return NextResponse.json({ 
        error: 'Insufficient points balance',
        currentBalance: customerMembership.pointsBalance,
        requested: points 
      }, { status: 400 });
    }
    
    // Create points transaction (negative points for redemption)
    const pointsTransaction = await db.customerPointsTransaction.create({
      data: {
        customerId,
        points: -points, // Negative points for redemption
        reason,
        description,
      },
    });
    
    // Update customer membership points balance
    await db.customerMembership.update({
      where: {
        id: customerMembership.id,
      },
      data: {
        pointsBalance: {
          decrement: points,
        },
      },
    });
    
    // If a voucher was specified, mark it as claimed
    if (voucherId) {
      await db.voucherRedemption.create({
        data: {
          customerId,
          voucherId,
        },
      });
    }
    
    // Create an activity to track this points claim
    await db.customerActivity.create({
      data: {
        customerId,
        type: 'points_redeemed',
        description: description || `Redeemed ${points} points: ${reason}`,
        pointsEarned: -points, // Negative points for redemption
        metadata: {
          transactionId: pointsTransaction.id,
          reason,
          points,
          voucherId,
        },
      }
    });

    return NextResponse.json({ 
      pointsTransaction,
      newBalance: customerMembership.pointsBalance - points 
    }, { status: 201 });
  } catch (error) {
    console.error('Error claiming points from customer:', error);
    return NextResponse.json({ error: 'Failed to claim points from customer' }, { status: 500 });
  }
}
