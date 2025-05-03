import { TelegrafContext } from '../types';
import { logger } from '../utils/logger';

/**
 * Handles user registration and welcome message
 */
export async function registerUserHandler(ctx: TelegrafContext) {
  try {
    const telegramUser = ctx.from;
    if (!telegramUser) {
      logger.error('No user information in context');
      return await ctx.reply('Sorry, we could not identify you. Please try again.');
    }
    
    // Default project ID fallback
    const defaultProjectId = process.env.DEFAULT_PROJECT_ID;
    if (!defaultProjectId) {
      throw new Error('DEFAULT_PROJECT_ID is not defined in environment variables');
    }
    
    // Set project ID in context
    ctx.projectId = defaultProjectId;
    
    // Get or create the Telegram user
    const user = await ctx.prisma.telegramUser.upsert({
      where: { telegramId: telegramUser.id.toString() },
      update: {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        lastInteraction: new Date(),
        isSubscribed: true
      },
      create: {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        isSubscribed: true,
        subscribedAt: new Date(),
        lastInteraction: new Date()
      }
    });
    
    logger.info(`User registered/updated: ${user.id}`);
    
    // Get project settings for welcome message
    const projectSettings = await ctx.prisma.telegramSettings.findUnique({
      where: { projectId: defaultProjectId }
    });
    
    // Send welcome message
    const welcomeMessage = projectSettings?.welcomeMessage || 
      'Welcome to our loyalty bot! 🎉\n\nUse /help to see available commands.\n\nYou can check your points with /points or view rewards with /rewards.';
    
    await ctx.reply(welcomeMessage, { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "Check Points", callback_data: "points" }],
          [{ text: "View Rewards", callback_data: "rewards" }]
        ]
      }
    });
    
    // Log the message sent by the bot
    await ctx.prisma.telegramMessage.create({
      data: {
        projectId: defaultProjectId,
        recipientId: user.id,
        content: welcomeMessage,
        isFromUser: false,
        messageType: 'TEXT',
        sentAt: new Date(),
        isDelivered: true,
        deliveredAt: new Date()
      }
    });
    
  } catch (error) {
    logger.error('Error in registerUserHandler:', error);
    await ctx.reply('Sorry, there was an error processing your registration. Please try again later.');
  }
}
