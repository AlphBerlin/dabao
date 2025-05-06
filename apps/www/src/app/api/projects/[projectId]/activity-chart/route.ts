import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { hasProjectAccess } from '@/lib/auth/project-access';

// GET /api/projects/[projectId]/activity-chart
export async function GET(
    request: Request,
    { params }: { params: { projectId: string } }
) {
    try {
        // Get authenticated user from Supabase
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId } = await params;

        // Get the timeframe from query params
        const url = new URL(request.url);
        const timeframe = url.searchParams.get('timeframe') || '7d';

        // Calculate date range based on timeframe
        const now = new Date();
        let startDate = new Date();
        let groupByFormat: 'day' | 'week' | 'month' = 'day';

        switch (timeframe) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                groupByFormat = 'day';
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                groupByFormat = 'day';
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                groupByFormat = 'week';
                break;
            case 'all':
                startDate = new Date(0); // Beginning of time
                groupByFormat = 'month';
                break;
            default:
                startDate.setDate(now.getDate() - 7);
                groupByFormat = 'day';
        }

        // Verify the user has access to this project
        const hasAccess = await hasProjectAccess(user.id, projectId);

        if (!hasAccess) {
            return NextResponse.json({ error: 'Project not access' }, { status: 400 });
        }

        // Generate date range for the chart
        const dates: Date[] = [];
        let currentDate = new Date(startDate);

        while (currentDate <= now) {
            dates.push(new Date(currentDate));

            if (groupByFormat === 'day') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (groupByFormat === 'week') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        // Get daily active customers data
        const customerActivities = await db.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT customer_id) as active_customers
      FROM dabao_tenant.customer_activities
      WHERE 
        created_at >= ${startDate} AND 
        created_at <= ${now} AND
        customer_id IN (
          SELECT id FROM dabao_tenant.customers 
          WHERE project_id = ${projectId}
        )
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

        // Format the data for the chart
        const activityMap = new Map<string, number>();

        (customerActivities as any[]).forEach((entry) => {
            const dateString = new Date(entry.date).toISOString().split('T')[0] as string;
            activityMap.set(dateString, Number(entry.active_customers));
        });

        const chartData = dates.map(date => {
            const dateString = date.toISOString().split('T')[0] as string;
            const displayFormat = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                ...(groupByFormat === 'month' ? { year: 'numeric' } : {})
            }).format(date);

            return {
                date: dateString,
                displayDate: displayFormat,
                value: activityMap.get(dateString) || 0
            };
        });

        return NextResponse.json({
            chartData
        });

    } catch (error) {
        console.error('Error fetching activity chart data:', error);
        return NextResponse.json(
            { error: 'Failed to load activity chart data' },
            { status: 500 }
        );
    }
}