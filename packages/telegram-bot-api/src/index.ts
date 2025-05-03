import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import express from 'express';
import { setupBot } from './bot';
import { setupWebhook } from './webhook';
import { logger } from './utils/logger';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Bot configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = parseInt(process.env.PORT || '3200', 10);
const WEBHOOK_URL = process.env.WEBHOOK_URL;

async function bootstrap() {
  if (!BOT_TOKEN) {
    logger.error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    process.exit(1);
  }

  try {
    // Initialize bot
    const bot = new Telegraf(BOT_TOKEN);
    
    // Setup bot commands and handlers
    await setupBot(bot, prisma);

    // Create express app for webhook
    const app = express();

    // Parse JSON bodies
    app.use(express.json());
    
    // Setup webhook if URL is provided
    if (WEBHOOK_URL) {
      logger.info(`Setting up webhook at ${WEBHOOK_URL}`);
      await setupWebhook(bot, app, WEBHOOK_URL);
    } else {
      logger.info('Starting bot in polling mode');
      await bot.launch();
    }

    // Setup API routes
    app.get('/health', (_, res) => {
      res.status(200).send({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Start express server
    app.listen(PORT, () => {
      logger.info(`Telegram bot server is running on port ${PORT}`);
    });

    // Enable graceful stop
    const gracefulShutdown = async () => {
      logger.info('Gracefully shutting down...');
      
      // Stop the bot
      bot.stop('SIGTERM');
      
      // Close Prisma connection
      await prisma.$disconnect();
      
      process.exit(0);
    };

    // Handle termination signals
    process.once('SIGINT', gracefulShutdown);
    process.once('SIGTERM', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start Telegram bot server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Start the application
bootstrap();
