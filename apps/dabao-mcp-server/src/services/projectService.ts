import { prisma } from '../lib/prisma.js';

/**
 * Functions for interacting with project data in the database
 */
export const projectService = {
  /**
   * Get a project by ID
   */
  async getProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        preferences: true,
      },
    });
  },

  /**
   * Get a project by slug
   */
  async getProjectBySlug(slug: string) {
    return prisma.project.findUnique({
      where: {
        slug,
      },
      include: {
        preferences: true,
      },
    });
  },

  /**
   * Get all membership tiers for a project
   */
  async getProjectMembershipTiers(projectId: string) {
    return prisma.membershipTier.findMany({
      where: {
        projectId,
      },
      orderBy: {
        level: 'asc',
      },
    });
  },

  /**
   * Get all active campaigns for a project
   */
  async getActiveProjectCampaigns(projectId: string) {
    return prisma.campaign.findMany({
      where: {
        projectId,
        active: true,
        OR: [
          {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          {
            startDate: { lte: new Date() },
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
      },
    });
  },

  /**
   * Get a project's rewards
   */
  async getProjectRewards(projectId: string) {
    return prisma.reward.findMany({
      where: {
        projectId,
        active: true,
      },
    });
  },

  /**
   * Get a project's available vouchers
   */
  async getProjectAvailableVouchers(projectId: string) {
    return prisma.voucher.findMany({
      where: {
        projectId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
  },
};