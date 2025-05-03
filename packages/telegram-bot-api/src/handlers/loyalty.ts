import { TelegrafContext } from '../types';
import { logger } from '../utils/logger';

/**
 * Handlers for loyalty-related commands
 */
export const loyaltyCommandsHandler = {
  /**
   * Get the user's points balance
   */
  async getPointsBalance(ctx: TelegrafContext) {
    try {
      const telegramId = ctx.from?.id.toString();
      if (!telegramId) {
        return await ctx.reply('Sorry, we could not identify you. Please try again.');
      }

      // Set default project ID in context
      const defaultProjectId = process.env.DEFAULT_PROJECT_ID;
      ctx.projectId = defaultProjectId;

      // Find the Telegram user
      const telegramUser = await ctx.prisma.telegramUser.findUnique({
        where: { telegramId },
        include: { customer: {
          include: { customerMemberships: true }
        }}
      });

      if (!telegramUser) {
        return await ctx.reply('Sorry, you are not registered in our system. Please use /start to register.');
      }

      // Check if the Telegram user is linked to a customer account
      if (!telegramUser.customer) {
        return await ctx.reply(
          'Your Telegram account is not linked to a customer profile yet. ' +
          'Please visit our website or app to link your account.'
        );
      }

      // Get the latest membership data
      const membership = telegramUser.customer.customerMemberships[0];
      
      if (!membership) {
        return await ctx.reply(
          'You do not have an active loyalty membership yet. ' +
          'Please visit our website or app to join our loyalty program.'
        );
      }

      // Get project preferences for points name
      const projectPreferences = await ctx.prisma.projectPreference.findUnique({
        where: { projectId: defaultProjectId }
      });

      const pointsName = projectPreferences?.pointsName || 'Points';
      const pointsBalance = membership.pointsBalance;

      await ctx.reply(
        `🌟 *Your ${pointsName} Balance*\n\n` +
        `You currently have *${pointsBalance} ${pointsName}*.\n\n` +
        `Use /rewards to see what you can redeem with your ${pointsName}!`,
        { parse_mode: 'Markdown' }
      );

      // Log the interaction
      await ctx.prisma.telegramMessage.create({
        data: {
          projectId: defaultProjectId || '',
          recipientId: telegramUser.id,
          content: `Points balance: ${pointsBalance}`,
          isFromUser: false,
          messageType: 'TEXT',
          sentAt: new Date(),
          isDelivered: true,
          deliveredAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error in getPointsBalance:', error);
      await ctx.reply('Sorry, there was an error retrieving your points balance. Please try again later.');
    }
  },

  /**
   * Get available rewards for the user
   */
  async getAvailableRewards(ctx: TelegrafContext) {
    try {
      const telegramId = ctx.from?.id.toString();
      if (!telegramId) {
        return await ctx.reply('Sorry, we could not identify you. Please try again.');
      }

      // Set default project ID in context
      const defaultProjectId = process.env.DEFAULT_PROJECT_ID;
      ctx.projectId = defaultProjectId;

      // Find the Telegram user
      const telegramUser = await ctx.prisma.telegramUser.findUnique({
        where: { telegramId },
        include: { customer: true }
      });

      if (!telegramUser) {
        return await ctx.reply('Sorry, you are not registered in our system. Please use /start to register.');
      }

      // Check if the Telegram user is linked to a customer account
      if (!telegramUser.customer) {
        return await ctx.reply(
          'Your Telegram account is not linked to a customer profile yet. ' +
          'Please visit our website or app to link your account.'
        );
      }

      // Get active rewards for the project
      const rewards = await ctx.prisma.reward.findMany({
        where: {
          projectId: defaultProjectId,
          active: true,
          expiresAt: {
            gte: new Date()
          }
        },
        take: 5 // Limit to avoid very long messages
      });

      if (rewards.length === 0) {
        return await ctx.reply('There are no active rewards available at the moment. Please check back later!');
      }

      // Format rewards message
      let rewardsMessage = '🎁 *Available Rewards*\n\n';
      rewards.forEach((reward, index) => {
        rewardsMessage += `${index + 1}. *${reward.name}*\n`;
        if (reward.description) {
          rewardsMessage += `   ${reward.description}\n`;
        }
        rewardsMessage += `   Value: ${reward.value} ${reward.type === 'POINTS' ? 'points' : '%'}\n\n`;
      });

      rewardsMessage += 'To redeem rewards, please visit our website or mobile app.';

      await ctx.reply(rewardsMessage, { parse_mode: 'Markdown' });

      // Log the interaction
      await ctx.prisma.telegramMessage.create({
        data: {
          projectId: defaultProjectId || '',
          recipientId: telegramUser.id,
          content: 'Available rewards list',
          isFromUser: false,
          messageType: 'TEXT',
          sentAt: new Date(),
          isDelivered: true,
          deliveredAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error in getAvailableRewards:', error);
      await ctx.reply('Sorry, there was an error retrieving available rewards. Please try again later.');
    }
  },

  /**
   * Get user profile information
   */
  async getProfile(ctx: TelegrafContext) {
    try {
      const telegramId = ctx.from?.id.toString();
      if (!telegramId) {
        return await ctx.reply('Sorry, we could not identify you. Please try again.');
      }

      // Set default project ID in context
      const defaultProjectId = process.env.DEFAULT_PROJECT_ID;
      ctx.projectId = defaultProjectId;

      // Find the Telegram user
      const telegramUser = await ctx.prisma.telegramUser.findUnique({
        where: { telegramId },
        include: { 
          customer: {
            include: { 
              customerMemberships: {
                include: {
                  membershipTier: true
                }
              }
            }
          }
        }
      });

      if (!telegramUser) {
        return await ctx.reply('Sorry, you are not registered in our system. Please use /start to register.');
      }

      // Check if the Telegram user is linked to a customer account
      if (!telegramUser.customer) {
        return await ctx.reply(
          'Your Telegram account is not linked to a customer profile yet. ' +
          'Please visit our website or app to link your account.'
        );
      }

      const customer = telegramUser.customer;
      const membership = customer.customerMemberships[0];

      // Format profile message
      let profileMessage = '👤 *Your Profile*\n\n';
      
      profileMessage += `*Name*: ${customer.name || 'Not set'}\n`;
      profileMessage += `*Email*: ${customer.email}\n`;
      
      if (membership) {
        profileMessage += `\n*Membership Level*: ${membership.membershipTier?.name || 'Standard'}\n`;
        profileMessage += `*Points Balance*: ${membership.pointsBalance}\n`;
        
        if (membership.stampsBalance > 0) {
          profileMessage += `*Stamps*: ${membership.stampsBalance}\n`;
        }
        
        if (membership.totalPointsEarned > 0) {
          profileMessage += `*Total Points Earned*: ${membership.totalPointsEarned}\n`;
        }
      }

      profileMessage += '\nTo update your profile or see more details, please visit our website or mobile app.';

      await ctx.reply(profileMessage, { parse_mode: 'Markdown' });

      // Log the interaction
      await ctx.prisma.telegramMessage.create({
        data: {
          projectId: defaultProjectId || '',
          recipientId: telegramUser.id,
          content: 'Profile information',
          isFromUser: false,
          messageType: 'TEXT',
          sentAt: new Date(),
          isDelivered: true,
          deliveredAt: new Date()
        }
      });

    } catch (error) {
      logger.error('Error in getProfile:', error);
      await ctx.reply('Sorry, there was an error retrieving your profile. Please try again later.');
    }
  }
};
