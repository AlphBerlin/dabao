import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Supabase
    const cookieStore = cookies();
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
      // User is authenticated in Supabase but not in our database
      // Return empty array since they don't have any organizations yet
      return NextResponse.json([]);
    }
    
    // Get all organizations for the user with their roles
    const userOrganizations = await prisma.userOrganization.findMany({
      where: {
        userId: user.id, // Use our internal user ID
      },
      include: {
        organization: true,
      },
    });
    
    // Map to just the organization data
    const organizations = userOrganizations.map(userOrg => ({
      ...userOrg.organization,
      role: userOrg.role,
    }));
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}