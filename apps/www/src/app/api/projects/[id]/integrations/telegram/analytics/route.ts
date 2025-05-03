import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';


// GET route to fetch analytics data for a telegram bot
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = (await params).id;
    // Get period from query string (default to month)
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';

    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if telegram settings exist
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }

    // Calculate date ranges based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Get user counts
    const totalUsers = await db.telegramUser.count({
      where: {
        projectId
      }
    });

    const activeUsers = await db.telegramUser.count({
      where: {
        projectId,
        lastInteraction: { gte: startDate }
      }
    });

    const subscribedUsers = await db.telegramUser.count({
      where: {
        projectId,
        isSubscribed: true
      }
    });

    const unsubscribedUsers = await db.telegramUser.count({
      where: {
        projectId,
        isSubscribed: false
      }
    });

    // Get message counts
    const messagesReceived = await db.telegramMessage.count({
      where: {
        projectId,
        isFromUser: true,
        sentAt: { gte: startDate }
      }
    });

    const messagesSent = await db.telegramMessage.count({
      where: {
        projectId,
        isFromUser: false,
        sentAt: { gte: startDate }
      }
    });

    // Calculate growth over time (grouped by date)
    const userGrowthData = await db.$queryRaw<{ date: string, count: number }[]>`
      SELECT 
        DATE_TRUNC('day', "created_at") as date, 
        COUNT(*) as count
      FROM 
        "dabao_tenant"."telegram_users"
      WHERE 
        "project_id" = ${projectId} 
        AND "created_at" >= ${startDate}
      GROUP BY 
        DATE_TRUNC('day', "created_at")
      ORDER BY 
        date ASC
    `;

    // Format data for charts
    const userGrowth = userGrowthData.map((item: any) => ({
      date: item.date.toString().split('T')[0],
      count: Number(item.count)
    }));

    // Calculate message activity over time
    const messageActivityData = await db.$queryRaw<{ date: string, sent: number, received: number }[]>`
      WITH sent_messages AS (
        SELECT 
          DATE_TRUNC('day', "sent_at") as date, 
          COUNT(*) as count
        FROM 
          "dabao_tenant"."telegram_messages"
        WHERE 
          "project_id" = ${projectId}
          AND "is_from_user" = false
          AND "sent_at" >= ${startDate}
        GROUP BY 
          DATE_TRUNC('day', "sent_at")
      ),
      received_messages AS (
        SELECT 
          DATE_TRUNC('day', "sent_at") as date, 
          COUNT(*) as count
        FROM 
          "dabao_tenant"."telegram_messages"
        WHERE 
          "project_id" = ${projectId} 
          AND "is_from_user" = true
          AND "sent_at" >= ${startDate}
        GROUP BY 
          DATE_TRUNC('day', "sent_at")
      )
      SELECT 
        COALESCE(s.date, r.date) as date,
        COALESCE(s.count, 0) as sent,
        COALESCE(r.count, 0) as received
      FROM 
        sent_messages s
      FULL OUTER JOIN 
        received_messages r ON s.date = r.date
      ORDER BY 
        date ASC
    `;

    // Format message activity data
    const messageActivity = messageActivityData.map((item: any) => ({
      date: item.date.toString().split('T')[0],
      sent: Number(item.sent),
      received: Number(item.received)
    }));

    // Return analytics data
    return NextResponse.json({
      totalUsers,
      activeUsers,
      subscribedUsers,
      unsubscribedUsers,
      messagesSent,
      messagesReceived,
      userGrowth,
      messageActivity
    });
  } catch (error) {
    console.error('Error fetching Telegram analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram analytics' },
      { status: 500 }
    );
  }
}
