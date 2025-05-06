import { prisma } from '../lib/prisma.js';

/**
 * Functions for interacting with Telegram data in the database
 */
export const telegramService = {
  /**
   * Get project Telegram settings
   */
  async getProjectTelegramSettings(projectId: string) {
    return prisma.telegramSettings.findUnique({
      where: {
        projectId,
      },
    });
  },

  /**
   * Create or update project Telegram settings
   */
  async upsertProjectTelegramSettings(
    projectId: string,
    data: {
      botToken?: string;
      webhookUrl?: string;
      channelIds?: string[];
      notificationSettings?: any;
      isActive?: boolean;
      analyticsEnabled?: boolean;
    },
  ) {
    // Check if settings already exist
    const existingSettings = await prisma.telegramSettings.findUnique({
      where: {
        projectId,
      },
    });

    if (existingSettings) {
      // Update existing settings
      return prisma.telegramSettings.update({
        where: {
          projectId,
        },
        data,
      });
    } else {
      // Create new settings
      return prisma.telegramSettings.create({
        data: {
          projectId,
          ...data,
        },
      });
    }
  },

  /**
   * Track a new Telegram user
   */
  async trackTelegramUser(data: {
    projectId: string;
    telegramUserId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
    metadata?: any;
    customerId?: string;
  }) {
    const { projectId, telegramUserId, ...userData } = data;

    // Check if user already exists
    const existingUser = await prisma.telegramUser.findUnique({
      where: {
        projectId_telegramUserId: {
          projectId,
          telegramUserId,
        },
      },
    });

    if (existingUser) {
      // Update existing user
      return prisma.telegramUser.update({
        where: {
          id: existingUser.id,
        },
        data: {
          ...userData,
          lastActive: new Date(),
        },
      });
    } else {
      // Create new user
      return prisma.telegramUser.create({
        data: {
          projectId,
          telegramUserId,
          ...userData,
          firstSeen: new Date(),
          lastActive: new Date(),
        },
      });
    }
  },

  /**
   * Connect Telegram user to a customer
   */
  async connectTelegramUserToCustomer(telegramUserId: string, customerId: string, projectId: string) {
    // Find the Telegram user
    const telegramUser = await prisma.telegramUser.findUnique({
      where: {
        projectId_telegramUserId: {
          projectId,
          telegramUserId,
        },
      },
    });

    if (!telegramUser) {
      throw new Error('Telegram user not found');
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Update the Telegram user with customer ID
    return prisma.telegramUser.update({
      where: {
        id: telegramUser.id,
      },
      data: {
        customerId,
      },
    });
  },

  /**
   * Track a Telegram message
   */
  async trackTelegramMessage(data: {
    projectId: string;
    messageId: string;
    chatId: string;
    telegramUserId?: string;
    direction: 'INCOMING' | 'OUTGOING';
    type: string;
    text?: string;
    metadata?: any;
    telegramCampaignId?: string;
  }) {
    const { projectId, ...messageData } = data;

    return prisma.telegramMessage.create({
      data: {
        projectId,
        ...messageData,
        sentAt: new Date(),
      },
    });
  },

  /**
   * Track a Telegram interaction (button clicks, commands, etc.)
   */
  async trackTelegramInteraction(data: {
    projectId: string;
    telegramUserId: string;
    messageId?: string;
    type: string;
    payload?: string;
    metadata?: any;
  }) {
    const { projectId, ...interactionData } = data;

    return prisma.telegramInteraction.create({
      data: {
        projectId,
        ...interactionData,
        timestamp: new Date(),
      },
    });
  },

  /**
   * Get Telegram analytics for a project
   */
  async getTelegramAnalytics(
    projectId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      includeUsers?: boolean;
      includeMessages?: boolean;
      includeInteractions?: boolean;
    },
  ) {
    const now = new Date();
    const startDate = options?.startDate || new Date(now.setMonth(now.getMonth() - 1));
    const endDate = options?.endDate || new Date();

    // Get user stats
    const newUsersCount = await prisma.telegramUser.count({
      where: {
        projectId,
        firstSeen: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const activeUsersCount = await prisma.telegramUser.count({
      where: {
        projectId,
        lastActive: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get message stats
    const incomingMessagesCount = await prisma.telegramMessage.count({
      where: {
        projectId,
        direction: 'INCOMING',
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const outgoingMessagesCount = await prisma.telegramMessage.count({
      where: {
        projectId,
        direction: 'OUTGOING',
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get interaction stats
    const interactionsCount = await prisma.telegramInteraction.count({
      where: {
        projectId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Group interactions by type
    const interactionsByType = await prisma.telegramInteraction.groupBy({
      by: ['type'],
      where: {
        projectId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Messages by day for trend analysis
    const messagesByDay = await prisma.telegramMessage.groupBy({
      by: ['sentAt'],
      where: {
        projectId,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Build analytics object
    const analytics = {
      period: {
        startDate,
        endDate,
      },
      users: {
        total: await prisma.telegramUser.count({ where: { projectId } }),
        new: newUsersCount,
        active: activeUsersCount,
      },
      messages: {
        total: incomingMessagesCount + outgoingMessagesCount,
        incoming: incomingMessagesCount,
        outgoing: outgoingMessagesCount,
      },
      interactions: {
        total: interactionsCount,
        byType: interactionsByType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      trends: {
        messagesByDay: messagesByDay.map(item => ({
          date: item.sentAt,
          count: item._count,
        })),
      },
    };

    // Add detailed data if requested
    if (options?.includeUsers) {
      analytics.users.details = await prisma.telegramUser.findMany({
        where: {
          projectId,
          lastActive: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          lastActive: 'desc',
        },
      });
    }

    if (options?.includeMessages) {
      analytics.messages.details = await prisma.telegramMessage.findMany({
        where: {
          projectId,
          sentAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 100, // Limit to most recent 100 messages
      });
    }

    if (options?.includeInteractions) {
      analytics.interactions.details = await prisma.telegramInteraction.findMany({
        where: {
          projectId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100, // Limit to most recent 100 interactions
      });
    }

    return analytics;
  },

  /**
   * Get Telegram campaign performance
   */
  async getTelegramCampaignPerformance(telegramCampaignId: string) {
    // Get the campaign
    const campaign = await prisma.telegramCampaign.findUnique({
      where: {
        id: telegramCampaignId,
      },
      include: {
        campaign: true,
      },
    });

    if (!campaign) {
      throw new Error('Telegram campaign not found');
    }

    // Get message stats
    const messages = await prisma.telegramMessage.findMany({
      where: {
        telegramCampaignId,
      },
      include: {
        interactions: true,
      },
    });

    // Calculate metrics
    const totalSent = messages.length;
    const viewed = messages.filter(msg => msg.status === 'VIEWED').length;
    const clicked = messages.filter(msg => msg.interactions.length > 0).length;

    // Get unique users who interacted
    const uniqueInteractingUsers = new Set(
      messages
        .flatMap(msg => msg.interactions)
        .map(interaction => interaction.telegramUserId)
    ).size;

    // Get engagements
    const engagements = await prisma.campaignEngagement.findMany({
      where: {
        campaign: {
          telegramCampaign: {
            id: telegramCampaignId,
          },
        },
      },
    });

    return {
      campaignName: campaign.campaign.name,
      performance: {
        messagesSent: totalSent,
        messagesViewed: viewed,
        messagesClicked: clicked,
        uniqueUsersInteracted: uniqueInteractingUsers,
        engagements: engagements.length,
      },
      metrics: {
        openRate: totalSent ? (viewed / totalSent) * 100 : 0,
        clickRate: viewed ? (clicked / viewed) * 100 : 0,
        conversionRate: totalSent ? (engagements.length / totalSent) * 100 : 0,
      },
    };
  },

  /**
   * Get most active Telegram users
   */
  async getMostActiveTelegramUsers(
    projectId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const limit = options?.limit || 10;
    const now = new Date();
    const startDate = options?.startDate || new Date(now.setMonth(now.getMonth() - 1));
    const endDate = options?.endDate || new Date();

    // Count messages per user
    const userMessageCounts = await prisma.telegramMessage.groupBy({
      by: ['telegramUserId'],
      where: {
        projectId,
        telegramUserId: { not: null },
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Count interactions per user
    const userInteractionCounts = await prisma.telegramInteraction.groupBy({
      by: ['telegramUserId'],
      where: {
        projectId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Combine the data
    const userActivityMap = new Map();

    userMessageCounts.forEach(item => {
      userActivityMap.set(item.telegramUserId, {
        telegramUserId: item.telegramUserId,
        messageCount: item._count,
        interactionCount: 0,
        totalActivity: item._count,
      });
    });

    userInteractionCounts.forEach(item => {
      if (userActivityMap.has(item.telegramUserId)) {
        const userData = userActivityMap.get(item.telegramUserId);
        userData.interactionCount = item._count;
        userData.totalActivity += item._count;
        userActivityMap.set(item.telegramUserId, userData);
      } else {
        userActivityMap.set(item.telegramUserId, {
          telegramUserId: item.telegramUserId,
          messageCount: 0,
          interactionCount: item._count,
          totalActivity: item._count,
        });
      }
    });

    // Convert to array and sort
    const sortedUsers = Array.from(userActivityMap.values()).sort(
      (a, b) => b.totalActivity - a.totalActivity,
    );

    // Get user details for top users
    const topUserIds = sortedUsers.slice(0, limit).map(u => u.telegramUserId);
    
    const userDetails = await prisma.telegramUser.findMany({
      where: {
        projectId,
        telegramUserId: { in: topUserIds as string[] },
      },
      include: {
        customer: true,
      },
    });

    // Combine activity data with user details
    return sortedUsers.slice(0, limit).map(activity => {
      const userDetail = userDetails.find(u => u.telegramUserId === activity.telegramUserId);
      return {
        ...activity,
        user: userDetail || null,
      };
    });
  },
};