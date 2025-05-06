import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/[projectId]/stats
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

    const {projectId} = await params;
    
    // Get the timeframe from query params
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '7d';
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }
    
    // Verify the user has access to this project
    const userProject = await db.project.findFirst({
      where: {
        id: projectId,
        organization: {
          users: {
            some: {
              userId: user.id,
            }
          }
        }
      }
    });
    
    if (!userProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Get total customers
    const totalCustomers = await db.customer.count({
      where: { projectId }
    });
    
    // Get new customers in the time period
    const newCustomers = await db.customer.count({
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      }
    });
    
    // Calculate customer growth
    let previousStartDate = new Date(startDate);
    let previousEndDate = new Date(startDate);
    
    switch (timeframe) {
      case '7d':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case '30d':
        previousStartDate.setDate(previousStartDate.getDate() - 30);
        break;
      case '90d':
        previousStartDate.setDate(previousStartDate.getDate() - 90);
        break;
      default:
        previousStartDate.setDate(previousStartDate.getDate() - 7);
    }
    
    const previousPeriodCustomers = await db.customer.count({
      where: {
        projectId,
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      }
    });
    
    const customerGrowth = previousPeriodCustomers === 0
      ? 100
      : Math.round((newCustomers - previousPeriodCustomers) / previousPeriodCustomers * 100);
    
    // Get active customers (those with recent activity)
    const activeCustomers = await db.customerActivity.groupBy({
      by: ['customerId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      _count: true
    });
    
    // Get total rewards
    const totalRewards = await db.reward.count({
      where: { projectId }
    });
    
    // Get redeemed rewards
    const redeemedRewards = await db.customerReward.count({
      where: {
        reward: {
          projectId
        },
        redeemedAt: {
          not: null,
          gte: startDate,
          lte: now
        }
      }
    });
    
    // Get total points issued
    const pointsTransactions = await db.customerPointsTransaction.aggregate({
      where: {
        customer: {
          projectId
        },
        points: {
          gt: 0
        },
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        points: true
      }
    });
    
    const totalPointsIssued = pointsTransactions._sum.points || 0;
    
    // Get reward value
    const totalRewardValue = await db.customerReward.count({
      where: {
        reward: {
          projectId
        },
        redeemedAt: {
          not: null,
          gte: startDate,
          lte: now
        }
      }
    }) * 100; // Assuming each reward is worth $100 on average
    
    // Calculate conversion rate (redeemed / total rewards issued)
    const issuedRewardsCount = await db.customerReward.count({
      where: {
        reward: {
          projectId
        },
        createdAt: {
          gte: startDate,
          lte: now
        }
      }
    });
    
    const conversionRate = issuedRewardsCount === 0
      ? 0
      : Math.round((redeemedRewards / issuedRewardsCount) * 100);
    
    // Return the stats
    return NextResponse.json({
      stats: {
        totalCustomers,
        customerGrowth,
        activeCustomers: activeCustomers.length,
        totalRewards,
        redeemedRewards,
        totalPointsIssued,
        totalRewardValue,
        conversionRate
      }
    });
    
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json(
      { error: 'Failed to load project stats' },
      { status: 500 }
    );
  }
}