import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { slugify } from '@/lib/utils/index';
import { UserRole } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';

// Validate the incoming request body
const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string(),
  plan: z.string(),
  billingEmail: z.string().email("Invalid email").optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from Supabase
    const supabase = await createClient();
    
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !supabaseUser) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    const result = createOrgSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 });
    }
    
    const { name, type, plan, billingEmail } = result.data;
    
    // Generate a slug from the organization name
    const slug = slugify(name);
    
    // Check if the slug is already in use
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });
    
    if (existingOrg) {
      return NextResponse.json({ error: 'Organization name already exists' }, { status: 409 });
    }
    
    // Check if user exists in our database; if not, create them
    let user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id }
    });
    
    if (!user) {
      // Create user record if it doesn't exist
      user = await prisma.user.create({
        data: {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
          image: supabaseUser.user_metadata?.avatar_url,
        }
      });
    }
    
    // Now create the organization with proper user association
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        ownerId: user.id, // Use our internal user ID, not the Supabase ID
        billingEmail: billingEmail || user.email,
        settings: {
          type,
          plan,
          createdAt: new Date().toISOString(),
        },
        users: {
          create: {
            userId: user.id,
            role: UserRole.OWNER,
          },
        },
      },
    });
    
    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Supabase
    const supabase = await createClient();
    
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !supabaseUser) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the user in our database
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: supabaseUser.id }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    // Get all organizations for this user
    const organizations = await prisma.organization.findMany({
      where: {
        users: {
          some: {
            userId: user.id,
          },
        },
      },
    });
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}