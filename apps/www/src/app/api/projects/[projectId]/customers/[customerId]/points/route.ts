import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Get points transactions for a specific customer
export async function GET(
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
    
    // Parse query parameters for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    // Get points transactions with pagination
    const pointsTransactions = await db.customerPointsTransaction.findMany({
      where: {
        customerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await db.customerPointsTransaction.count({
      where: {
        customerId,
      },
    });

    // Get current points balance
    const customerMembership = await db.customerMembership.findFirst({
      where: {
        customerId,
      },
      select: {
        pointsBalance: true,
        totalPointsEarned: true,
      },
    });

    return NextResponse.json({ 
      pointsTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
      },
      balance: customerMembership?.pointsBalance || 0,
      totalEarned: customerMembership?.totalPointsEarned || 0
    });
  } catch (error) {
    console.error('Error fetching customer points transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch customer points transactions' }, { status: 500 });
  }
}
