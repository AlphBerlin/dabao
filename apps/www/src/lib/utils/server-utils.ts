import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

/**
 * Get the current organization ID from cookies in server components
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  // Try to get organization ID from cookies
  const cookieStore = await cookies();
  const orgId = cookieStore.get('orgId')?.value;
  
  if (orgId) {
    return orgId;
  }
  
  // If no cookie, try to get the first organization for the user
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        organizations: {
          include: {
            organization: true,
          },
          take: 1,
        },
      },
    });
    
    if (dbUser?.organizations?.[0]?.organizationId) {
      return dbUser.organizations[0].organizationId;
    }
  } catch (error) {
    console.error('Error getting current organization ID:', error);
  }
  
  return null;
}

/**
 * Get the current organization with details from the database
 */
export async function getCurrentOrganization() {
  const orgId = await getCurrentOrganizationId();
  
  if (!orgId) {
    return null;
  }
  
  try {
    return await db.organization.findUnique({
      where: { id: orgId },
    });
  } catch (error) {
    console.error('Error getting organization details:', error);
    return null;
  }
}