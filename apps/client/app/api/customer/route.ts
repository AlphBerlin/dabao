import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { z } from 'zod';

// Schema for customer update validation
const customerUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional().nullable(),
});

/**
 * GET /api/customer
 * Get the current authenticated customer's data
 */
export async function GET() {
  // Get project context from headers
  const headersList = headers();
  const projectId = headersList.get('x-project-id');
  
  if (!projectId) {
    return NextResponse.json(
      { error: 'Project context not available' },
      { status: 400 }
    );
  }
  
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Find customer by Supabase user ID and project ID
    const customer = await db.customer.findFirst({
      where: {
        projectId,
        supabaseUserId: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Return customer data
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/customer
 * Update the current authenticated customer's data
 */
export async function PATCH(request: NextRequest) {
  // Get project context from headers
  const headersList = headers();
  const projectId = headersList.get('x-project-id');
  
  if (!projectId) {
    return NextResponse.json(
      { error: 'Project context not available' },
      { status: 400 }
    );
  }
  
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = customerUpdateSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const updateData = validationResult.data;
    
    // Find and update customer
    const updatedCustomer = await db.customer.updateMany({
      where: {
        projectId,
        supabaseUserId: user.id,
      },
      data: updateData,
    });
    
    if (!updatedCustomer.count) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Get the updated customer data
    const customer = await db.customer.findFirst({
      where: {
        projectId,
        supabaseUserId: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // Return updated customer data
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer data' },
      { status: 500 }
    );
  }
}
