import { prisma } from '../lib/prisma.js';

/**
 * Functions for interacting with customer data in the database
 */
export const customerService = {
  /**
   * Find a customer by their email
   */
  async findCustomerByEmail(email: string, projectId: string) {
    return prisma.customer.findFirst({
      where: {
        email,
        projectId,
      },
      include: {
        customerMemberships: {
          include: {
            membershipTier: true,
          },
        },
        pointsTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  },

  /**
   * Get a customer's points balance
   */
  async getCustomerPoints(customerId: string) {
    const pointsTransactions = await prisma.customerPointsTransaction.findMany({
      where: {
        customerId,
      },
    });

    return pointsTransactions.reduce((total, transaction) => total + transaction.points, 0);
  },

  /**
   * Get a customer's recent activity
   */
  async getCustomerActivity(customerId: string, limit = 5) {
    return prisma.customerActivity.findMany({
      where: {
        customerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  },

  /**
   * Get all memberships for a customer
   */
  async getCustomerMemberships(customerId: string) {
    return prisma.customerMembership.findMany({
      where: {
        customerId,
      },
      include: {
        membershipTier: true,
      },
    });
  },

  /**
   * Get vouchers redeemed by a customer
   */
  async getCustomerVouchers(customerId: string) {
    return prisma.voucherRedemption.findMany({
      where: {
        customerId,
      },
      include: {
        voucher: true,
      },
    });
  },

  /**
   * Get stamp cards for a customer
   */
  async getCustomerStampCards(customerId: string) {
    return prisma.stampCard.findMany({
      where: {
        customerId,
      },
      include: {
        stamps: true,
      },
    });
  },
};