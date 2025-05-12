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
      botToken: string;
      botUsername: string;
      webhookUrl?: string;
      welcomeMessage?: string;
      helpMessage?: string;
      status?: string;
      enableCommands?: boolean;
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
    telegramId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
    isSubscribed?: boolean;
    customerId?: string;
  }) {
    const { projectId, telegramId, ...userData } = data;

    // Check if user already exists
    const existingUser = await prisma.telegramUser.findUnique({
      where: {
        telegramId_projectId: {
          telegramId,
          projectId,
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
          lastInteraction: new Date(),
        },
      });
    } else {
      // Create new user
      return prisma.telegramUser.create({
        data: {
          projectId,
          telegramId,
          ...userData,
          isSubscribed: userData.isSubscribed ?? true,
          subscribedAt: new Date(),
          lastInteraction: new Date(),
          createdAt: new Date(),
        },
      });
    }
  },

  /**
   * Connect Telegram user to a customer
   */
  async connectTelegramUserToCustomer(telegramId: string, customerId: string, projectId: string) {
    // Find the Telegram user
    const telegramUser = await prisma.telegramUser.findUnique({
      where: {
        telegramId_projectId: {
          telegramId,
          projectId,
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
    telegramMsgId?: string;
    senderId?: string;
    recipientId?: string;
    isFromUser: boolean;
    messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'STICKER' | 'LOCATION' | 'CONTACT' | 'POLL' | 'ANIMATION';
    content: string;
    buttons?: any;
    mediaUrl?: string;
    isDelivered?: boolean;
    isRead?: boolean;
    hasClicked?: boolean;
    campaignId?: string;
  }) {
    const { projectId, ...messageData } = data;

    return prisma.telegramMessage.create({
      data: {
        projectId,
        ...messageData,
        messageType: messageData.messageType || 'TEXT',
        sentAt: new Date(),
        deliveredAt: messageData.isDelivered ? new Date() : null,
        readAt: messageData.isRead ? new Date() : null,
        clickedAt: messageData.hasClicked ? new Date() : null,
      },
    });
  },

  /**
   * Track a Telegram interaction (button clicks, commands, etc.)
   */
  async trackTelegramInteraction(data: {
    projectId: string;
    telegramId: string;
    messageId?: string;
    type: string;
    payload?: string;
    metadata?: any;
  }) {
    const { projectId, ...interactionData } = data;

    return {}
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
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const activeUsersCount = await prisma.telegramUser.count({
      where: {
        projectId,
        lastInteraction: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get message stats
    const incomingMessagesCount = await prisma.telegramMessage.count({
      where: {
        projectId,
        isFromUser: true,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const outgoingMessagesCount = await prisma.telegramMessage.count({
      where: {
        projectId,
        isFromUser: false,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
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
        details:{}
      },
      messages: {
        total: incomingMessagesCount + outgoingMessagesCount,
        incoming: incomingMessagesCount,
        outgoing: outgoingMessagesCount,
        details: {}
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
          lastInteraction: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          lastInteraction: 'desc',
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
        campaignId: telegramCampaignId,
      },
    });

    // Calculate metrics
    const totalSent = campaign.sentCount;
    const viewed = campaign.readCount;
    const clicked = campaign.clickCount;

    // Get unique users who interacted
    const uniqueInteractingUsers = await prisma.telegramMessage.groupBy({
      by: ['recipientId'],
      where: {
        campaignId: telegramCampaignId,
        hasClicked: true,
      },
      _count: true,
    });


    return {
      campaignName: campaign.campaign?.name || campaign.name,
      performance: {
        messagesSent: totalSent,
        messagesViewed: viewed,
        messagesClicked: clicked,
        uniqueUsersInteracted: uniqueInteractingUsers.length,
      },
      metrics: {
        openRate: totalSent ? (viewed / totalSent) * 100 : 0,
        clickRate: viewed ? (clicked / viewed) * 100 : 0,
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
      by: ['senderId'],
      where: {
        projectId,
        isFromUser: true,
        sentAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Combine the data
    const userActivityMap = new Map();

    userMessageCounts.forEach(item => {
      if (item.senderId) {
        userActivityMap.set(item.senderId, {
          userId: item.senderId,
          messageCount: item._count,
          interactionCount: 0,
          totalActivity: item._count,
        });
      }
    });

  

    // Convert to array and sort
    const sortedUsers = Array.from(userActivityMap.values()).sort(
      (a, b) => b.totalActivity - a.totalActivity,
    );

    // Get user details for top users
    const topUserIds = sortedUsers.slice(0, limit).map(u => u.userId);
    
    const userDetails = await prisma.telegramUser.findMany({
      where: {
        projectId,
        id: { in: topUserIds as string[] },
      },
      include: {
        customer: true,
      },
    });

    // Combine activity data with user details
    return sortedUsers.slice(0, limit).map(activity => {
      const userDetail = userDetails.find(u => u.id === activity.userId);
      return {
        ...activity,
        user: userDetail || null,
      };
    });
  },
};