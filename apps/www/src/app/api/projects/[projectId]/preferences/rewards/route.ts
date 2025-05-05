import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for reward system preferences
const rewardPreferencesSchema = z.object({
  rewardSystemType: z.enum(["POINTS", "STAMPS"]),
  pointsName: z.string().min(1).max(50).optional(),
  pointsAbbreviation: z.string().min(1).max(10).optional(),
  pointsToStampRatio: z.number().int().min(1).optional(),
  pointsExpiryDays: z.number().int().min(1).optional().nullable(),
  stampsPerCard: z.number().int().min(1).max(100).optional(),
});

// Get reward preferences for a specific project
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
    
    // Get project preferences
    const preferences = await db.projectPreference.findUnique({
      where: { projectId },
      select: {
        rewardSystemType: true,
        pointsName: true,
        pointsAbbreviation: true,
        pointsToStampRatio: true,
        pointsExpiryDays: true,
        stampsPerCard: true,
      }
    });
    
    if (!preferences) {
      return NextResponse.json({ 
        error: 'Preferences not found for this project',
      }, { status: 404 });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching reward preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch reward preferences' }, { status: 500 });
  }
}

// Update reward preferences for a specific project
export async function PATCH(
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
    const validationResult = rewardPreferencesSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { 
      rewardSystemType, 
      pointsName, 
      pointsAbbreviation, 
      pointsToStampRatio, 
      pointsExpiryDays, 
      stampsPerCard 
    } = validationResult.data;
    
    // Check if preferences exist for this project
    const existingPreferences = await db.projectPreference.findUnique({
      where: { projectId }
    });
    
    let preferences;
    
    if (existingPreferences) {
      // Update existing preferences
      preferences = await db.projectPreference.update({
        where: { projectId },
        data: {
          ...(rewardSystemType && { rewardSystemType }),
          ...(pointsName && { pointsName }),
          ...(pointsAbbreviation && { pointsAbbreviation }),
          ...(pointsToStampRatio && { pointsToStampRatio }),
          ...(pointsExpiryDays !== undefined && { pointsExpiryDays }),
          ...(stampsPerCard && { stampsPerCard }),
        }
      });
    } else {
      // Create new preferences
      preferences = await db.projectPreference.create({
        data: {
          projectId,
          rewardSystemType: rewardSystemType || "POINTS",
          ...(pointsName && { pointsName }),
          ...(pointsAbbreviation && { pointsAbbreviation }),
          ...(pointsToStampRatio && { pointsToStampRatio }),
          ...(pointsExpiryDays !== undefined && { pointsExpiryDays }),
          ...(stampsPerCard && { stampsPerCard }),
        }
      });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error updating reward preferences:', error);
    return NextResponse.json({ error: 'Failed to update reward preferences' }, { status: 500 });
  }
}