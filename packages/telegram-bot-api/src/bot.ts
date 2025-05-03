import { Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { registerUserHandler } from './handlers/user';
import { loyaltyCommandsHandler } from './handlers/loyalty';
import { TelegrafContext } from './types';

/**
 * Sets up the Telegram bot with commands and middleware
 */
export async function setupBot(bot: Telegraf<Context>, prisma: PrismaClient) {
  // Setup project context middleware
  bot.use(async (ctx, next) => {
    try {
      // Make prisma available in context
      (ctx as TelegrafContext).prisma = prisma;
      return await next();
    } catch (error) {
      logger.error('Error in bot middleware:', error);
    }
  });

  // Register commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Show help information' },
    { command: 'points', description: 'Check your points balance' },
    { command: 'rewards', description: 'View available rewards' },
    { command: 'profile', description: 'View your profile and membership details' },
    { command: 'subscribe', description: 'Subscribe to notifications' },
    { command: 'unsubscribe', description: 'Unsubscribe from notifications' },
  ]);

  // Handle /start command
  bot.command('start', async (ctx) => {
    try {
      await registerUserHandler(ctx as TelegrafContext);
    } catch (error) {
      logger.error('Error handling start command:', error);
      ctx.reply('Sorry, there was an error processing your request. Please try again later.');
    }
  });

  // Handle /help command
  bot.command('help', async (ctx) => {
    try {
      await ctx.reply(
        'Welcome to the Loyalty Bot! Here are the available commands:\n\n' +
        '/start - Start the bot\n' +
        '/points - Check your points balance\n' +
        '/rewards - View available rewards\n' +
        '/profile - View your profile and membership details\n' +
        '/subscribe - Subscribe to notifications\n' +
        '/unsubscribe - Unsubscribe from notifications\n\n' +
        'If you need further assistance, please contact support.'
      );
    } catch (error) {
      logger.error('Error handling help command:', error);
      ctx.reply('Sorry, there was an error processing your request. Please try again later.');
    }
  });

  // Handle loyalty-related commands
  bot.command('points', (ctx) => loyaltyCommandsHandler.getPointsBalance(ctx as TelegrafContext));
  bot.command('rewards', (ctx) => loyaltyCommandsHandler.getAvailableRewards(ctx as TelegrafContext));
  bot.command('profile', (ctx) => loyaltyCommandsHandler.getProfile(ctx as TelegrafContext));

  // Handle subscription commands
  bot.command('subscribe', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      
      await prisma.telegramUser.update({
        where: { telegramId },
        data: { 
          isSubscribed: true,
          unsubscribedAt: null
        },
      });
      
      await ctx.reply('You have successfully subscribed to notifications!');
    } catch (error) {
      logger.error('Error handling subscribe command:', error);
      ctx.reply('Sorry, there was an error processing your request. Please try again later.');
    }
  });

  bot.command('unsubscribe', async (ctx) => {
    try {
      const telegramId = ctx.from.id.toString();
      
      await prisma.telegramUser.update({
        where: { telegramId },
        data: { 
          isSubscribed: false,
          unsubscribedAt: new Date()
        },
      });
      
      await ctx.reply('You have successfully unsubscribed from notifications. You can resubscribe anytime with /subscribe');
    } catch (error) {
      logger.error('Error handling unsubscribe command:', error);
      ctx.reply('Sorry, there was an error processing your request. Please try again later.');
    }
  });

  // Handle regular messages
  bot.on(message('text'), async (ctx) => {
    try {
      const text = ctx.message.text;
      const telegramId = ctx.from.id.toString();
      
      // Log message for analytics
      await prisma.telegramMessage.create({
        data: {
          projectId: (ctx as TelegrafContext).projectId || process.env.DEFAULT_PROJECT_ID || '',
          telegramMsgId: ctx.message.message_id.toString(),
          senderId: (await getOrCreateTelegramUser(prisma, telegramId)).id,
          content: text,
          isFromUser: true,
          messageType: 'TEXT',
          sentAt: new Date(ctx.message.date * 1000)
        }
      });
      
      // Echo message for now
      ctx.reply(`I received your message: ${text}`);
    } catch (error) {
      logger.error('Error handling text message:', error);
    }
  });

  // Error handling
  bot.catch((err, ctx) => {
    logger.error(`Bot error for ${ctx.updateType}`, err);
  });
  
  logger.info('Bot setup completed successfully');
  return bot;
}

/**
 * Helper function to get or create a Telegram user
 */
async function getOrCreateTelegramUser(prisma: PrismaClient, telegramId: string) {
  const existingUser = await prisma.telegramUser.findUnique({
    where: { telegramId }
  });
  
  if (existingUser) {
    return existingUser;
  }
  
  // Default project ID fallback
  const defaultProjectId = process.env.DEFAULT_PROJECT_ID;
  if (!defaultProjectId) {
    throw new Error('DEFAULT_PROJECT_ID is not defined in environment variables');
  }
  
  // Create new user
  return await prisma.telegramUser.create({
    data: {
      telegramId,
      isSubscribed: true,
      subscribedAt: new Date(),
    }
  });
}
