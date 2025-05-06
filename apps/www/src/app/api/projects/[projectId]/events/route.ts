import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/[projectId]/events
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
    
    // Get the timeframe and limit from query params
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
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
    
    // Fetch customer activities for this project (using customer -> project relationship)
    const customerActivities = await db.customerActivity.findMany({
      where: {
        customer: {
          projectId
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            externalId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Fetch point transactions
    const pointTransactions = await db.customerPointsTransaction.findMany({
      where: {
        customer: {
          projectId
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            externalId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Fetch reward redemptions
    const rewardRedemptions = await db.customerReward.findMany({
      where: {
        reward: {
          projectId
        },
        redeemedAt: {
          not: null
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            externalId: true
          }
        },
        reward: {
          select: {
            id: true,
            name: true,
            type: true,
            value: true
          }
        }
      },
      orderBy: {
        redeemedAt: 'desc'
      },
      take: limit
    });
    
    // Fetch new customers
    const newCustomers = await db.customer.findMany({
      where: {
        projectId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    // Fetch active campaigns
    const campaigns = await db.campaign.findMany({
      where: {
        projectId,
        status: 'ACTIVE'
      },
      orderBy: {
        startDate: 'desc'
      },
      take: limit
    });
    
    // Combine and format all events
    const events = [
      ...customerActivities.map(activity => ({
        type: 'ACTIVITY',
        title: 'Customer activity',
        description: activity.description || `${activity.type} activity recorded`,
        customerId: activity.customerId,
        customerName: activity.customer.name || activity.customer.email,
        timestamp: activity.createdAt,
        metadata: activity.metadata
      })),
      
      ...pointTransactions.map(transaction => ({
        type: 'POINTS',
        title: transaction.points > 0 ? 'Points awarded' : 'Points redeemed',
        description: `${transaction.customer.name || transaction.customer.email} ${
          transaction.points > 0 ? 'earned' : 'spent'
        } ${Math.abs(transaction.points)} points${
          transaction.description ? ` - ${transaction.description}` : ''
        }`,
        customerId: transaction.customerId,
        customerName: transaction.customer.name || transaction.customer.email,
        timestamp: transaction.createdAt,
        pointsAmount: transaction.points
      })),
      
      ...rewardRedemptions.map(redemption => ({
        type: 'REWARD',
        title: 'Reward redemption',
        description: `${redemption.customer.name || redemption.customer.email} redeemed ${redemption.reward.name}`,
        customerId: redemption.customerId,
        customerName: redemption.customer.name || redemption.customer.email,
        timestamp: redemption.redeemedAt!,
        rewardId: redemption.reward.id,
        rewardName: redemption.reward.name
      })),
      
      ...newCustomers.map(customer => ({
        type: 'NEW_CUSTOMER',
        title: 'New customer',
        description: `${customer.name || customer.email} joined the program`,
        customerId: customer.id,
        customerName: customer.name || customer.email,
        timestamp: customer.createdAt
      })),
      
      ...campaigns.map(campaign => ({
        type: 'CAMPAIGN',
        title: 'Campaign started',
        description: `${campaign.name} campaign is now active`,
        campaignId: campaign.id,
        campaignName: campaign.name,
        timestamp: campaign.startDate || campaign.createdAt
      }))
    ];
    
    // Sort all events by timestamp (most recent first)
    const sortedEvents = events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, limit);
    
    // Map timestamps to readable format with how long ago it was
    const formattedEvents = sortedEvents.map(event => {
      const timestamp = new Date(event.timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
      
      let timeAgo;
      if (diffInSeconds < 60) {
        timeAgo = `${diffInSeconds}s ago`;
      } else if (diffInSeconds < 3600) {
        timeAgo = `${Math.floor(diffInSeconds / 60)}m ago`;
      } else if (diffInSeconds < 86400) {
        timeAgo = `${Math.floor(diffInSeconds / 3600)}h ago`;
      } else {
        timeAgo = `${Math.floor(diffInSeconds / 86400)}d ago`;
      }
      
      return {
        ...event,
        timeAgo
      };
    });
    
    return NextResponse.json({
      events: formattedEvents
    });
    
  } catch (error) {
    console.error('Error fetching project events:', error);
    return NextResponse.json(
      { error: 'Failed to load project events' },
      { status: 500 }
    );
  }
}