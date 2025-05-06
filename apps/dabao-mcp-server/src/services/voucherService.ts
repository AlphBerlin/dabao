import { prisma } from '../lib/prisma.js';

/**
 * Functions for interacting with voucher data in the database
 */
export const voucherService = {
  /**
   * Get a voucher by ID
   */
  async getVoucherById(voucherId: string) {
    return prisma.voucher.findUnique({
      where: {
        id: voucherId,
      },
    });
  },

  /**
   * Get voucher by code for a project
   */
  async getVoucherByCode(code: string, projectId: string) {
    return prisma.voucher.findUnique({
      where: {
        projectId_code: {
          projectId,
          code,
        },
      },
    });
  },

  /**
   * Create a new voucher
   */
  async createVoucher(data: {
    projectId: string;
    code: string;
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    minimumSpend?: number;
    usageLimit?: number;
    perCustomerLimit?: number;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
    requiredPoints?: number;
    requiredStamps?: number;
  }) {
    return prisma.voucher.create({
      data,
    });
  },

  /**
   * Update an existing voucher
   */
  async updateVoucher(
    voucherId: string,
    data: {
      name?: string;
      description?: string;
      discountType?: string;
      discountValue?: number;
      minimumSpend?: number;
      usageLimit?: number;
      perCustomerLimit?: number;
      startDate?: Date;
      endDate?: Date;
      isActive?: boolean;
      requiredPoints?: number;
      requiredStamps?: number;
    },
  ) {
    return prisma.voucher.update({
      where: {
        id: voucherId,
      },
      data,
    });
  },

  /**
   * Delete a voucher
   */
  async deleteVoucher(voucherId: string) {
    return prisma.voucher.delete({
      where: {
        id: voucherId,
      },
    });
  },

  /**
   * Get all vouchers for a project with optional filtering
   */
  async getAllProjectVouchers(
    projectId: string,
    options?: {
      onlyActive?: boolean;
      onlyFuture?: boolean;
    },
  ) {
    const where = {
      projectId,
      ...(options?.onlyActive ? { isActive: true } : {}),
      ...(options?.onlyFuture
        ? {
            endDate: {
              gte: new Date(),
            },
          }
        : {}),
    };

    return prisma.voucher.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Track a voucher redemption
   */
  async redeemVoucher(voucherId: string, customerId: string, orderId?: string) {
    // Validate voucher is active and not expired
    const voucher = await prisma.voucher.findUnique({
      where: {
        id: voucherId,
        isActive: true,
        startDate: {
          lte: new Date(),
        },
        endDate: {
          gte: new Date(),
        },
      },
    });

    if (!voucher) {
      throw new Error('Voucher not found or is not active');
    }

    // Check usage limits if set
    if (voucher.usageLimit) {
      const usageCount = await prisma.voucherRedemption.count({
        where: { voucherId },
      });

      if (usageCount >= voucher.usageLimit) {
        throw new Error('Voucher usage limit has been reached');
      }
    }

    // Check per-customer limits if set
    if (voucher.perCustomerLimit) {
      const customerUsageCount = await prisma.voucherRedemption.count({
        where: { voucherId, customerId },
      });

      if (customerUsageCount >= voucher.perCustomerLimit) {
        throw new Error('Customer has reached their redemption limit for this voucher');
      }
    }

    // Create redemption record
    return prisma.voucherRedemption.create({
      data: {
        voucherId,
        customerId,
        ...(orderId ? { orderId } : {}),
      },
      include: {
        voucher: true,
      },
    });
  },

  /**
   * Get voucher redemption history for a specific voucher
   */
  async getVoucherRedemptions(voucherId: string) {
    return prisma.voucherRedemption.findMany({
      where: {
        voucherId,
      },
      include: {
        customer: true,
      },
      orderBy: {
        usedAt: 'desc',
      },
    });
  },

  /**
   * Validate a voucher for a customer
   */
  async validateVoucher(code: string, customerId: string, projectId: string) {
    const voucher = await prisma.voucher.findUnique({
      where: {
        projectId_code: {
          projectId,
          code,
        },
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!voucher) {
      return { valid: false, message: 'Voucher not found or expired' };
    }

    // Check usage limits if set
    if (voucher.usageLimit) {
      const usageCount = await prisma.voucherRedemption.count({
        where: { voucherId: voucher.id },
      });

      if (usageCount >= voucher.usageLimit) {
        return { valid: false, message: 'Voucher usage limit has been reached' };
      }
    }

    // Check per-customer limits if set
    if (voucher.perCustomerLimit) {
      const customerUsageCount = await prisma.voucherRedemption.count({
        where: { voucherId: voucher.id, customerId },
      });

      if (customerUsageCount >= voucher.perCustomerLimit) {
        return { valid: false, message: 'You have already used this voucher' };
      }
    }

    // Check if points/stamps requirements are met
    if (voucher.requiredPoints || voucher.requiredStamps) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          customerMemberships: true,
        },
      });

      if (!customer) {
        return { valid: false, message: 'Customer not found' };
      }

      const membership = customer.customerMemberships[0];
      
      if (voucher.requiredPoints && (!membership || membership.pointsBalance < voucher.requiredPoints)) {
        return { valid: false, message: 'Not enough points to redeem this voucher' };
      }

      if (voucher.requiredStamps && (!membership || membership.stampsBalance < voucher.requiredStamps)) {
        return { valid: false, message: 'Not enough stamps to redeem this voucher' };
      }
    }

    return { valid: true, voucher };
  },
};