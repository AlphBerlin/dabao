import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for project preference updates
const projectPreferenceSchema = z.object({
  pointsName: z.string().min(1).max(50).optional(),
  pointsAbbreviation: z.string().min(1).max(10).optional(),
  welcomeMessage: z.string().max(500).optional().nullable(),
  defaultCurrency: z.enum(['USD', 'EUR', 'GBP', 'SGD', 'INR', 'AUD', 'CAD', 'JPY', 'CNY', 'MYR']).optional(),
  enableReferrals: z.boolean().optional(),
  enableTiers: z.boolean().optional(),
  enableGameification: z.boolean().optional(),
});

// Get project preferences
export async function GET(
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
    
    // Get project preferences
    const preferences = await db.projectPreference.findUnique({
      where: {
        projectId
      }
    });
    
    if (!preferences) {
      return NextResponse.json({ error: 'Project preferences not found' }, { status: 404 });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching project preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch project preferences' }, { status: 500 });
  }
}

// Update project preferences
export async function PATCH(
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
    
    // Check if project preferences exist
    const existingPreferences = await db.projectPreference.findUnique({
      where: {
        projectId,
      }
    });
    
    if (!existingPreferences) {
      return NextResponse.json({ error: 'Project preferences not found' }, { status: 404 });
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validationResult = projectPreferenceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Validation error', details: validationResult.error.format() }, { status: 400 });
    }
    
    const { 
      pointsName, 
      pointsAbbreviation, 
      welcomeMessage, 
      defaultCurrency, 
      enableReferrals, 
      enableTiers, 
      enableGameification 
    } = validationResult.data;
    
    // If disabling referrals, check if there are existing customer referrals
    if (enableReferrals === false && existingPreferences.enableReferrals === true) {
      const referralCount = await db.customerReferral.count({
        where: {
          customer: {
            projectId
          }
        }
      });
      
      if (referralCount > 0) {
        // We won't throw an error, but we'll warn the client that there are existing referrals
        console.warn(`Disabling referrals for project ${projectId} with ${referralCount} existing referrals`);
      }
    }
    
    // Update the preferences
    const updatedPreferences = await db.projectPreference.update({
      where: {
        projectId,
      },
      data: {
        ...(pointsName !== undefined && { pointsName }),
        ...(pointsAbbreviation !== undefined && { pointsAbbreviation }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(defaultCurrency !== undefined && { defaultCurrency }),
        ...(enableReferrals !== undefined && { enableReferrals }),
        ...(enableTiers !== undefined && { enableTiers }),
        ...(enableGameification !== undefined && { enableGameification }),
      }
    });

    return NextResponse.json({ preferences: updatedPreferences });
  } catch (error) {
    console.error('Error updating project preferences:', error);
    return NextResponse.json({ error: 'Failed to update project preferences' }, { status: 500 });
  }
}