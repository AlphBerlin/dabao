import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId =(await params).id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "week"; // day, week, month
    const limit = Number(searchParams.get("limit") || "50");
    
    // Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case "day":
        startDate.setDate(now.getDate() - 1);
        break;
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7); // Default to week
    }

    // Fetch activities
    const activities = await db.customerActivity.findMany({
      where: {
        customer: {
          projectId,
        },
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Get aggregated data for chart
    let groupByFormat = "%Y-%m-%d"; // Default for week
    
    if (period === "day") {
      groupByFormat = "%Y-%m-%d %H:00:00"; // Group by hour
    } else if (period === "month") {
      groupByFormat = "%Y-%m-%d"; // Group by day for month view
    }

    // This is for PostgreSQL
    const activityStats = await db.$queryRaw`
      SELECT 
        TO_CHAR(created_at, ${groupByFormat}) AS time_period,
        COUNT(*) AS activity_count,
        COALESCE(SUM(points_earned), 0) AS points_issued
      FROM dabao_tenant.customer_activities ca
      JOIN dabao_tenant.customers c ON ca.customer_id = c.id
      WHERE c.project_id = ${projectId}
      AND ca.created_at >= ${startDate}
      GROUP BY time_period
      ORDER BY time_period
    `;

    return NextResponse.json({
      activities,
      activityStats,
      period,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}