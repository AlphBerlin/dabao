import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { generateId } from '@/lib/utils';

// Schema for customer creation and updates
const customerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Get customers for a specific project
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
    
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const search = url.searchParams.get('search') || undefined;
    
    // Get project customers with pagination and search
    const customers = await db.customer.findMany({
      where: { 
        projectId,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { externalId: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
      include: {
        _count: {
          select: {
            rewards: true,
            activities: true,
            referrals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });
    
    // Get total count
    const total = await db.customer.count({
      where: { 
        projectId,
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { externalId: { contains: search, mode: 'insensitive' } },
          ]
        } : {}),
      },
    });

    return NextResponse.json({ 
      customers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// Create a new customer for a specific project
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
    const validationResult = customerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { name, email, phone, externalId, metadata } = validationResult.data;
    
    // Check if customer with this email already exists for this project
    const existingCustomer = await db.customer.findFirst({
      where: {
        projectId,
        email
      }
    });
    
    if (existingCustomer) {
      return NextResponse.json({ error: 'Customer with this email already exists for this project' }, { status: 400 });
    }
    
    // Check if externalId already exists for this project (if provided)
    if (externalId) {
      const existingCustomerByExtId = await db.customer.findFirst({
        where: {
          projectId,
          externalId
        }
      });
      
      if (existingCustomerByExtId) {
        return NextResponse.json({ error: 'Customer with this external ID already exists for this project' }, { status: 400 });
      }
    }
    
    // Create the customer and a referral code in a transaction
    const customer = await db.$transaction(async (tx) => {
      // Create the customer
      const newCustomer = await tx.customer.create({
        data: {
          projectId,
          name,
          email,
          phone,
          externalId,
          metadata
        }
      });
      
      // Get project preferences to check if referrals are enabled
      const projectPrefs = await tx.projectPreference.findUnique({
        where: {
          projectId
        }
      });
      
      // Create a referral code if referrals are enabled
      if (projectPrefs?.enableReferrals) {
        await tx.customerReferral.create({
          data: {
            customerId: newCustomer.id,
            referralCode: `${name ? name.substring(0, 3).toLowerCase() : 'ref'}-${generateId(6)}`.replace(/\s+/g, '')
          }
        });
      }
      
      return newCustomer;
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}