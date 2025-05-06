import { prisma } from '../lib/prisma.js';

/**
 * Functions for interacting with membership tier data in the database
 */
export const tierService = {
  /**
   * Get a membership tier by ID
   */
  async getTierById(tierId: string) {
    return prisma.membershipTier.findUnique({
      where: {
        id: tierId,
      },
    });
  },

  /**
   * Create a new membership tier
   */
  async createTier(data: {
    projectId: string;
    name: string;
    description?: string;
    level: number;
    pointsThreshold?: number;
    stampsThreshold?: number;
    spendThreshold?: number;
    subscriptionFee?: number;
    benefits?: any;
    icon?: string;
    autoUpgrade?: boolean;
    pointsMultiplier?: number;
  }) {
    return prisma.membershipTier.create({
      data,
    });
  },

  /**
   * Update an existing membership tier
   */
  async updateTier(
    tierId: string,
    data: {
      name?: string;
      description?: string;
      level?: number;
      pointsThreshold?: number;
      stampsThreshold?: number;
      spendThreshold?: number;
      subscriptionFee?: number;
      benefits?: any;
      icon?: string;
      autoUpgrade?: boolean;
      pointsMultiplier?: number;
    },
  ) {
    return prisma.membershipTier.update({
      where: {
        id: tierId,
      },
      data,
    });
  },

  /**
   * Delete a membership tier
   */
  async deleteTier(tierId: string) {
    return prisma.membershipTier.delete({
      where: {
        id: tierId,
      },
    });
  },

  /**
   * Get all tiers for a project
   */
  async getAllProjectTiers(projectId: string) {
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
   * Get customers in a specific tier
   */
  async getTierCustomers(tierId: string) {
    return prisma.customerMembership.findMany({
      where: {
        membershipTierId: tierId,
        isActive: true,
      },
      include: {
        customer: true,
      },
    });
  },

  /**
   * Assign a customer to a tier
   */
  async assignCustomerToTier(
    customerId: string,
    tierId: string,
    data?: {
      startDate?: Date;
      endDate?: Date;
      pointsBalance?: number;
      stampsBalance?: number;
    },
  ) {
    // Check if customer already has membership in this tier
    const existingMembership = await prisma.customerMembership.findFirst({
      where: {
        customerId,
        membershipTierId: tierId,
      },
    });

    if (existingMembership) {
      // If exists, update it
      return prisma.customerMembership.update({
        where: {
          id: existingMembership.id,
        },
        data: {
          ...data,
          isActive: true,
        },
        include: {
          membershipTier: true,
          customer: true,
        },
      });
    }

    // If not exists, create new
    return prisma.customerMembership.create({
      data: {
        customerId,
        membershipTierId: tierId,
        ...data,
      },
      include: {
        membershipTier: true,
        customer: true,
      },
    });
  },

  /**
   * Remove a customer from a tier
   */
  async removeCustomerFromTier(customerId: string, tierId: string) {
    const membership = await prisma.customerMembership.findFirst({
      where: {
        customerId,
        membershipTierId: tierId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new Error('Customer is not in this tier');
    }

    return prisma.customerMembership.update({
      where: {
        id: membership.id,
      },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });
  },

  /**
   * Check eligibility for tier upgrade based on customer data
   */
  async checkTierEligibility(customerId: string, projectId: string) {
    // Get customer data with membership info
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        customerMemberships: {
          include: {
            membershipTier: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get all project tiers ordered by level
    const allTiers = await prisma.membershipTier.findMany({
      where: {
        projectId,
      },
      orderBy: {
        level: 'asc',
      },
    });

    // Find current tier
    const activeMembership = customer.customerMemberships.find(m => m.isActive);
    const currentTierLevel = activeMembership?.membershipTier?.level || 0;

    // Get customer points balance and spend total
    const pointsTransactions = await prisma.customerPointsTransaction.findMany({
      where: {
        customerId,
      },
    });

    const pointsBalance = pointsTransactions.reduce(
      (total, transaction) => total + transaction.points,
      0,
    );

    // Find eligible tiers
    const eligibleTiers = allTiers.filter(tier => {
      // Only consider higher tiers than current
      if (tier.level <= currentTierLevel) {
        return false;
      }

      // Check points threshold if exists
      if (tier.pointsThreshold !== null && pointsBalance < tier.pointsThreshold) {
        return false;
      }

      // Check spend threshold if exists and customer has an active membership
      if (tier.spendThreshold !== null && activeMembership) {
        return activeMembership.totalSpent >= tier.spendThreshold;
      }

      // Check stamps threshold if exists and customer has an active membership
      if (tier.stampsThreshold !== null && activeMembership) {
        return activeMembership.totalStampsEarned >= tier.stampsThreshold;
      }

      return true;
    });

    return {
      currentTier: activeMembership?.membershipTier || null,
      eligibleTiers,
      nextTier: eligibleTiers.length > 0 ? eligibleTiers[0] : null,
      pointsBalance,
      totalSpent: activeMembership?.totalSpent || 0,
      totalStamps: activeMembership?.totalStampsEarned || 0,
    };
  },

  /**
   * Update customer tier based on points/spend/stamps
   * Used for automatic tier upgrades
   */
  async updateCustomerTier(customerId: string, projectId: string) {
    const eligibility = await this.checkTierEligibility(customerId, projectId);

    if (eligibility.nextTier && eligibility.nextTier.autoUpgrade) {
      // Auto upgrade to next eligible tier
      return this.assignCustomerToTier(customerId, eligibility.nextTier.id);
    }

    return { 
      upgraded: false, 
      currentTier: eligibility.currentTier,
      eligibleTiers: eligibility.eligibleTiers
    };
  },
};