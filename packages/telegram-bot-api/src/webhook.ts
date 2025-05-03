import { Telegraf, Context } from 'telegraf';
import express from 'express';
import { logger } from './utils/logger';

/**
 * Sets up the webhook for the Telegram bot
 */
export async function setupWebhook(bot: Telegraf<Context>, app: express.Application, webhookUrl: string) {
  try {
    const webhookPath = new URL(webhookUrl).pathname;
    
    // Set webhook with Telegram servers
    await bot.telegram.setWebhook(webhookUrl);
    logger.info(`Webhook set for ${webhookUrl}`);
    
    // Setup webhook handling in Express app
    app.use(bot.webhookCallback(webhookPath));
    
    logger.info('Webhook setup complete');
    return true;
  } catch (error) {
    logger.error('Error setting up webhook:', error);
    throw error;
  }
}
