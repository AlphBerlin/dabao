import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for customer updates
const customerUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Valid email is required").optional(),
  phone: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Get a specific customer
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string, customerId: string } }
) {
  try {
    const { projectId, customerId } = await params;
    
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
    
    // Get customer with full details
    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
        projectId,
      },
      include: {
        rewards: {
          include: {
            reward: true
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        referrals: {
          include: {
            referredUsers: true
          }
        }
      }
    });
    
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Get customer stats
    const pointsEarned = await db.customerActivity.aggregate({
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
    
    // Get the project preferences for points name
    const projectPrefs = await db.projectPreference.findUnique({
      where: {
        projectId,
      },
      select: {
        pointsName: true,
        pointsAbbreviation: true,
      },
    });
    
    return NextResponse.json({ 
      customer,
      stats: {
        totalPoints: pointsEarned._sum.pointsEarned || 0,
        pointsName: projectPrefs?.pointsName || 'Points',
        pointsAbbreviation: projectPrefs?.pointsAbbreviation || 'pts',
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// Update a specific customer
export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string, customerId: string } }
) {
  try {
    const { projectId, customerId } = await params;
    
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
    const existingCustomer = await db.customer.findUnique({
      where: {
        id: customerId,
        projectId,
      }
    });
    
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = customerUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { name, email, phone, externalId, metadata } = validationResult.data;
    
    // Check if email already exists for this project (if provided and changed)
    if (email && email !== existingCustomer.email) {
      const duplicateEmail = await db.customer.findFirst({
        where: {
          projectId,
          email,
          NOT: {
            id: customerId
          }
        }
      });
      
      if (duplicateEmail) {
        return NextResponse.json({ error: 'Customer with this email already exists for this project' }, { status: 400 });
      }
    }
    
    // Check if externalId already exists for this project (if provided and changed)
    if (externalId && externalId !== existingCustomer.externalId) {
      const duplicateExternalId = await db.customer.findFirst({
        where: {
          projectId,
          externalId,
          NOT: {
            id: customerId
          }
        }
      });
      
      if (duplicateExternalId) {
        return NextResponse.json({ error: 'Customer with this external ID already exists for this project' }, { status: 400 });
      }
    }
    
    // Update the customer
    const updatedCustomer = await db.customer.update({
      where: {
        id: customerId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(externalId !== undefined && { externalId }),
        ...(metadata !== undefined && { 
          metadata: {
            ...existingCustomer.metadata,
            ...metadata
          }
        }),
      },
      include: {
        referrals: true
      }
    });

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// Delete a specific customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string, customerId: string } }
) {
  try {
    const { projectId, customerId } = await params;
    
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
    const existingCustomer = await db.customer.findUnique({
      where: {
        id: customerId,
        projectId,
      }
    });
    
    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    // Delete the customer (will cascade delete related records thanks to our schema)
    await db.customer.delete({
      where: {
        id: customerId,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}