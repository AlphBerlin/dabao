import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Schema for preference updates
const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
});

// GET handler to retrieve user preferences
export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id },
      include: { preferences: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return existing preferences or default values if not set
    if (dbUser.preferences) {
      return NextResponse.json(dbUser.preferences);
    } else {
      // Return default preferences (matching schema defaults)
      return NextResponse.json({
        theme: 'system',
        language: 'en-US',
        emailNotifications: true,
        marketingEmails: true
      });
    }
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user preferences' },
      { status: 500 }
    );
  }
}

// PUT handler to update user preferences
export async function PUT(req: NextRequest) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user in our database
    const dbUser = await db.user.findUnique({
      where: { supabaseUserId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = PreferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({
        error: 'Validation error',
        details: validationResult.error.format()
      }, { status: 400 });
    }

    const preferences = validationResult.data;

    // Update or create user preferences
    const updatedPreferences = await db.userPreference.upsert({
      where: {
        userId: dbUser.id
      },
      update: preferences,
      create: {
        userId: dbUser.id,
        ...preferences
      }
    });

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update user preferences' },
      { status: 500 }
    );
  }
}
