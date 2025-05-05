import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import botManager from '@/services/bot-manager';
import { createClient } from '@/lib/supabase/server';

// POST /api/projects/[projectId]/integrations/telegram/refresh-menus
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = (await params).projectId;

    // Check if project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, ownerId: true, members: { select: { userId: true } } }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== userId && !project.members.some(member => member.userId === userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Trigger the bot manager to refresh menus
    if (botManager) {
      await botManager.updateBotMenus(projectId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Bot manager not available" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error refreshing Telegram menus:', error);
    return NextResponse.json(
      { error: "Error refreshing Telegram menus" },
      { status: 500 }
    );
  }
}