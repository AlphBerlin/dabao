import { CampaignType, CampaignStatus, TelegramCampaignStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

/**
 * Functions for interacting with campaign data in the database
 */
export const campaignService = {
  /**
   * Get a campaign by ID
   */
  async getCampaignById(campaignId: string) {
    return prisma.campaign.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        rewards: {
          include: {
            reward: true,
          },
        },
        telegramCampaign: true,
      },
    });
  },

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    projectId: string;
    name: string;
    description?: string;
    type: CampaignType;
    startDate?: Date;
    endDate?: Date;
    pointsMultiplier?: number;
    active?: boolean;
    status?: CampaignStatus;
    telegramCampaign?: {
      messageTemplate: string;
      targetAudience?: string;
      scheduledFor?: Date; // Changed to match schema
      audienceFilter?: any; // Changed to match schema
      buttons?: any; // Added to match schema
      imageUrl?: string; // Added to match schema
    };
    rewards?: {
      rewardId: string;
      quantity?: number; // We'll handle this differently since it's not in the schema
    }[];
  }) {
    const { telegramCampaign, rewards, ...campaignData } = data;

    // Create the campaign first
    const campaign = await prisma.campaign.create({
      data: campaignData,
    });

    // Add Telegram campaign if provided
    if (telegramCampaign) {
      await prisma.telegramCampaign.create({
        data: {
          ...telegramCampaign,
          campaignId: campaign.id,
          projectId: data.projectId,
          name: data.name, // Using the campaign name
          description: data.description,
          status: TelegramCampaignStatus.DRAFT, // Default status
        },
      });
    }

    // Add campaign rewards if provided
    if (rewards && rewards.length > 0) {
      await Promise.all(
        rewards.map(reward =>
          prisma.campaignReward.create({
            data: {
              campaignId: campaign.id,
              rewardId: reward.rewardId,
            },
          }),
        ),
      );
    }

    return this.getCampaignById(campaign.id);
  },

  /**
   * Update an existing campaign
   */
  async updateCampaign(
    campaignId: string,
    data: {
      name?: string;
      description?: string;
      type?: CampaignType;
      startDate?: Date;
      endDate?: Date;
      pointsMultiplier?: number;
      active?: boolean;
      status?: CampaignStatus;
      telegramCampaign?: {
        messageTemplate?: string;
        targetAudience?: string;
        scheduledFor?: Date;
        audienceFilter?: any;
        buttons?: any;
        imageUrl?: string;
      };
      rewards?: {
        rewardId: string;
        quantity?: number;
      }[];
    },
  ) {
    const { telegramCampaign, rewards, ...campaignData } = data;

    // Update the main campaign
    await prisma.campaign.update({
      where: {
        id: campaignId,
      },
      data: campaignData,
    });

    // Update Telegram campaign if provided
    if (telegramCampaign) {
      const existingTelegramCampaign = await prisma.telegramCampaign.findUnique({
        where: {
          campaignId,
        },
      });

      if (existingTelegramCampaign) {
        // Update existing campaign
        await prisma.telegramCampaign.update({
          where: {
            id: existingTelegramCampaign.id,
          },
          data: {
            ...(telegramCampaign.messageTemplate && { messageTemplate: telegramCampaign.messageTemplate }),
            ...(telegramCampaign.targetAudience && { audienceFilter: { set: telegramCampaign.targetAudience } }),
            ...(telegramCampaign.scheduledFor && { scheduledFor: telegramCampaign.scheduledFor }),
            ...(telegramCampaign.buttons && { buttons: { set: telegramCampaign.buttons } }),
            ...(telegramCampaign.imageUrl && { imageUrl: telegramCampaign.imageUrl }),
          },
        });
      } else {
        // Create new campaign
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { projectId: true, name: true, description: true }
        });
        
        if (campaign) {
          await prisma.telegramCampaign.create({
            data: {
              messageTemplate: telegramCampaign.messageTemplate || "",
              audienceFilter: telegramCampaign.targetAudience,
              scheduledFor: telegramCampaign.scheduledFor,
              buttons: telegramCampaign.buttons,
              imageUrl: telegramCampaign.imageUrl,
              campaignId,
              projectId: campaign.projectId,
              name: campaign.name,
              description: campaign.description,
              status: TelegramCampaignStatus.DRAFT,
            },
          });
        }
      }
    }

    // Update rewards if provided
    if (rewards && rewards.length > 0) {
      // First remove existing rewards
      await prisma.campaignReward.deleteMany({
        where: {
          campaignId,
        },
      });

      // Then add the new ones
      await Promise.all(
        rewards.map(reward =>
          prisma.campaignReward.create({
            data: {
              campaignId,
              rewardId: reward.rewardId,
              // Note: quantity is not in the schema, so we don't save it
            },
          }),
        ),
      );
    }

    return this.getCampaignById(campaignId);
  },

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string) {
    // Delete related records first
    await prisma.telegramCampaign.deleteMany({
      where: {
        campaignId,
      },
    });

    await prisma.campaignReward.deleteMany({
      where: {
        campaignId,
      },
    });

    // Then delete the campaign itself
    return prisma.campaign.delete({
      where: {
        id: campaignId,
      },
    });
  },

  /**
   * Get all campaigns for a project with optional filtering
   */
  async getAllProjectCampaigns(
    projectId: string,
    options?: {
      onlyActive?: boolean;
      type?: CampaignType;
      status?: CampaignStatus;
    },
  ) {
    const where = {
      projectId,
      ...(options?.onlyActive ? { active: true } : {}),
      ...(options?.type ? { type: options.type } : {}),
      ...(options?.status ? { status: options.status } : {}),
    };

    return prisma.campaign.findMany({
      where,
      include: {
        rewards: {
          include: {
            reward: true,
          },
        },
        telegramCampaign: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  },

  /**
   * Get active campaigns for a project
   */
  async getActiveCampaigns(projectId: string) {
    const now = new Date();
    return prisma.campaign.findMany({
      where: {
        projectId,
        active: true,
        OR: [
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          {
            startDate: { lte: now },
            endDate: null,
          },
        ],
      },
      include: {
        rewards: {
          include: {
            reward: true,
          },
        },
        telegramCampaign: true,
      },
    });
  },

  /**
   * Track customer engagement with a campaign
   */
  async trackCampaignEngagement(
    campaignId: string,
    customerId: string,
    data?: {
      type: string;
      pointsEarned?: number;
      metadata?: any;
      telegramMessageId?: string;
    },
  ) {
    // Use CustomerActivity model instead since CampaignEngagement doesn't exist
    return prisma.customerActivity.create({
      data: {
        customerId,
        type: data?.type || 'CAMPAIGN_VIEW',
        pointsEarned: data?.pointsEarned || 0,
        metadata: {
          campaignId,
          telegramMessageId: data?.telegramMessageId,
          ...data?.metadata
        },
        description: `Engagement with campaign ${campaignId}`,
      },
      include: {
        customer: true,
      },
    });
  },

  /**
   * Get campaign engagement metrics
   */
  async getCampaignMetrics(campaignId: string) {
    // Use CustomerActivity model filtered by campaign ID in metadata
    const engagements = await prisma.customerActivity.findMany({
      where: {
        metadata: {
          path: ['campaignId'],
          equals: campaignId,
        },
      },
      include: {
        customer: true,
      },
    });

    type Engagement = {
      customerId: string;
      type: string;
      pointsEarned?: number | null;
    };

    const uniqueCustomers = new Set(engagements.map((e: Engagement) => e.customerId)).size;
    const totalPointsAwarded = engagements.reduce((sum: number, e: Engagement) => sum + (e.pointsEarned || 0), 0);
    const engagementsByType = engagements.reduce((acc: Record<string, number>, e: Engagement) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEngagements: engagements.length,
      uniqueCustomers,
      totalPointsAwarded,
      engagementsByType,
    };
  },

  /**
   * Schedule a Telegram campaign message
   */
  async scheduleTelegramCampaign(
    telegramCampaignId: string,
    data: {
      scheduledSendDate: Date;
      targetAudience?: string;
    },
  ) {
    return prisma.telegramCampaign.update({
      where: {
        id: telegramCampaignId,
      },
      data: {
        scheduledFor: data.scheduledSendDate,
        audienceFilter: data.targetAudience ? { set: data.targetAudience } : undefined,
        status: TelegramCampaignStatus.SCHEDULED,
      },
    });
  },

  /**
   * Track Telegram campaign message delivery
   */
  async trackTelegramMessageSent(
    telegramCampaignId: string,
    data: {
      messageId: string;
      chatId: string;
      userId?: string;
      sentAt?: Date;
      metadata?: any;
    },
  ) {
    return prisma.telegramMessage.create({
      data: {
        campaignId: telegramCampaignId, // Use campaignId instead of telegramCampaignId
        telegramMsgId: data.messageId, // Use telegramMsgId instead of messageId
        content: data.chatId, // Using chatId as content since content is required
        messageType: "TEXT", // Default to TEXT type
        isFromUser: false, // Message is from the bot
        isDelivered: true, // Mark as delivered
        sentAt: data.sentAt || new Date(),
        projectId: "placeholder", // Temporary placeholder, should be replaced with actual project ID
      },
    });
  },

  /**
   * Update Telegram message engagement status
   */
  async updateTelegramMessageStatus(
    telegramMessageId: string,
    data: {
      status: string;
      engagement?: string;
      metadata?: any;
    },
  ) {
    return prisma.telegramMessage.update({
      where: {
        id: telegramMessageId,
      },
      data: {
        isDelivered: data.status === 'DELIVERED',
        isRead: data.status === 'READ',
        hasClicked: data.status === 'CLICKED',
        // Update timestamps based on status
        ...(data.status === 'DELIVERED' && { deliveredAt: new Date() }),
        ...(data.status === 'READ' && { readAt: new Date() }),
        ...(data.status === 'CLICKED' && { clickedAt: new Date() }),
      },
    });
  },

  /**
   * Get campaigns with Telegram integration
   */
  async getTelegramCampaigns(projectId: string) {
    return prisma.campaign.findMany({
      where: {
        projectId,
        telegramCampaign: {
          isNot: null,
        },
      },
      include: {
        telegramCampaign: {
          include: {
            messages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};