import { Campaign, TelegramCampaign, CampaignType, CampaignStatus, TelegramCampaignStatus } from '@prisma/client';
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
    type: string;
    startDate?: Date;
    endDate?: Date;
    pointsMultiplier?: number;
    active?: boolean;
    status?: string;
    telegramCampaign?: {
      messageTemplate: string;
      targetAudience?: string;
      scheduledSendDate?: Date;
      trackingParams?: any;
      channelId?: string;
    };
    rewards?: {
      rewardId: string;
      quantity?: number;
    }[];
  }) {
    const { telegramCampaign, rewards, ...campaignData } = data;

    // Create the campaign first
    const campaign = await prisma.campaign.create({
      data: campaignData as Campaign,
    });

    // Add Telegram campaign if provided
    if (telegramCampaign) {
      await prisma.telegramCampaign.create({
        data: {
          ...telegramCampaign,
          campaignId: campaign.id,
        } as TelegramCampaign,
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
      type?: string;
      startDate?: Date;
      endDate?: Date;
      pointsMultiplier?: number;
      active?: boolean;
      status?: string;
      telegramCampaign?: {
        messageTemplate?: string;
        targetAudience?: string;
        scheduledSendDate?: Date;
        trackingParams?: any;
        channelId?: string;
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
        await prisma.telegramCampaign.update({
          where: {
            id: existingTelegramCampaign.id,
          },
          data: telegramCampaign,
        });
      } else {
        await prisma.telegramCampaign.create({
          data: {
            ...telegramCampaign,
            campaignId,
          } as TelegramCampaign,
        });
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
              quantity: reward.quantity || 1,
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
      type?: string;
      status?: string;
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
    return prisma.campaignEngagement.create({
      data: {
        campaignId,
        customerId,
        type: data?.type || 'VIEWED',
        pointsEarned: data?.pointsEarned || 0,
        metadata: data?.metadata,
        telegramMessageId: data?.telegramMessageId,
      },
      include: {
        campaign: true,
        customer: true,
      },
    });
  },

  /**
   * Get campaign engagement metrics
   */
  async getCampaignMetrics(campaignId: string) {
    const engagements = await prisma.campaignEngagement.findMany({
      where: {
        campaignId,
      },
      include: {
        customer: true,
      },
    });

    const uniqueCustomers = new Set(engagements.map(e => e.customerId)).size;
    const totalPointsAwarded = engagements.reduce((sum, e) => sum + e.pointsEarned, 0);
    const engagementsByType = engagements.reduce((acc, e) => {
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
        scheduledSendDate: data.scheduledSendDate,
        targetAudience: data.targetAudience,
        status: 'SCHEDULED',
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
        telegramCampaignId,
        messageId: data.messageId,
        chatId: data.chatId,
        userId: data.userId,
        sentAt: data.sentAt || new Date(),
        metadata: data.metadata,
        status: 'SENT',
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
      data,
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