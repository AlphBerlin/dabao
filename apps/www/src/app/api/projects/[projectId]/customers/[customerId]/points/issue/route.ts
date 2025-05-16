import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for issuing points to a customer
const issuePointsSchema = z.object({
  points: z.number().int().positive(),
  reason: z.string().min(1),
  description: z.string().optional(),
  orderId: z.string().optional(),
  expiresAt: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "Invalid date format" }
  ),
});

// Issue points to a customer
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
      }
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = issuePointsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { points, reason, description, orderId, expiresAt } = validationResult.data;
    
    // Create points transaction
    const pointsTransaction = await db.customerPointsTransaction.create({
      data: {
        customerId,
        points,
        reason,
        description,
        orderId,
        ...(expiresAt && !isNaN(Date.parse(expiresAt)) && { expiresAt: new Date(expiresAt) }),
      },
    });
    
    // Update customer membership points balance
    const customerMembership = await db.customerMembership.findFirst({
      where: {
        customerId,
      },
    });
    
    if (customerMembership) {
      await db.customerMembership.update({
        where: {
          id: customerMembership.id,
        },
        data: {
          pointsBalance: {
            increment: points,
          },
          totalPointsEarned: {
            increment: points,
          },
        },
      });
    }
    
    // Create an activity to track this points issuance
    await db.customerActivity.create({
      data: {
        customerId,
        type: 'points_issued',
        description: description || `Issued ${points} points: ${reason}`,
        pointsEarned: points,
        metadata: {
          transactionId: pointsTransaction.id,
          reason,
          points,
          orderId,
        },
      }
    });

    return NextResponse.json({ pointsTransaction }, { status: 201 });
  } catch (error) {
    console.error('Error issuing points to customer:', error);
    return NextResponse.json({ error: 'Failed to issue points to customer' }, { status: 500 });
  }
}
