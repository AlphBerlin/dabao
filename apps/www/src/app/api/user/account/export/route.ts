import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// GET handler for exporting user data
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
      include: {
        preferences: true,
        organizations: {
          include: {
            organization: {
              include: {
                projects: true
              }
            }
          }
        }
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the data export
    const userData = {
      profile: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        createdAt: dbUser.createdAt,
      },
      preferences: dbUser.preferences || {
        theme: 'system',
        language: 'en-US',
        emailNotifications: true,
        marketingEmails: true
      },
      organizations: dbUser.organizations.map(membership => ({
        id: membership.organization.id,
        name: membership.organization.name,
        role: membership.role,
        joinedAt: membership.createdAt,
        projects: membership.organization.projects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          slug: project.slug,
          createdAt: project.createdAt,
        }))
      }))
    };

    // Set filename for the download
    const filename = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
