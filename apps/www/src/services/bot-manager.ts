// src/services/botManager.ts
import { Bot, BotError, Context, session, webhookCallback } from 'grammy';
import { db } from '@/lib/db';

// Singleton class to manage all bots across the application
export class BotManager {
  private static instance: BotManager;
  private activeBots: Map<string, Bot> = new Map();
  private initialized = false;

  private constructor() {}

  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  // Initialize bots from database
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Fetch all active projects with telegram settings
      const projects = await db.project.findMany({
        where: { 
          telegramSettings: { 
            isNot: null 
          } 
        },
        include: {
          telegramSettings: true
        }
      });

      // Initialize bots for each project
      for (const project of projects) {
        if (project.telegramSettings?.botToken) {
          await this.createBot(project.id, project.telegramSettings.botToken);
        }
      }

      this.initialized = true;
      console.log(`Initialized ${this.activeBots.size} bots`);
    } catch (error) {
      console.error('Error initializing bots:', error);
      throw error;
    }
  }

  // Create and configure a new bot
  public async createBot(projectId: string, token: string): Promise<Bot | null> {
    try {
      // Get existing bot instance or create new one
      let bot = this.activeBots.get(projectId);
      
      // If bot already exists with this token, return it
      if (bot) return bot;
      
      // Create new bot instance
      bot = new Bot(token);

      // Fetch project settings
      const settings = await db.telegramSettings.findUnique({
        where: { projectId }
      });

      if (!settings) {
        throw new Error('Telegram settings not found');
      }

      // Configure session storage (can use Redis in production)
      bot.use(session({
        initial: () => ({ projectId }),
      }));

      // Set up error handling
      bot.catch((err: BotError) => {
        console.error(`Error in bot ${projectId}:`, err);
        // Update bot status in database
        this.updateBotStatus(projectId, 'error', err.message);
      });

      // Set up command handlers
      this.setupCommandHandlers(bot, settings);
      
      // Start the bot (polling mode for development, webhook in production)
      if (process.env.NODE_ENV === 'production' && settings.webhookUrl) {
        // Webhook mode - don't need to call bot.start()
        console.log(`Bot ${projectId} configured for webhook: ${settings.webhookUrl}`);
        await bot.api.setWebhook(settings.webhookUrl, {
          secret_token: projectId,
          drop_pending_updates: true
        });
      } else {
        // Polling mode (development)
        console.log(`Starting bot ${projectId} in polling mode`);
        bot.start({
          drop_pending_updates: true,
          allowed_updates: ["message", "callback_query"]
        }).catch(err => {
          console.error(`Failed to start bot ${projectId}:`, err);
          this.updateBotStatus(projectId, 'offline', err.message);
        });
      }

      // Store the bot instance
      this.activeBots.set(projectId, bot);
      
      // Update bot status in database
      await this.updateBotStatus(projectId, 'online');

      return bot;
    } catch (error:any) {
      console.error(`Error creating bot for project ${projectId}:`, error);
      await this.updateBotStatus(projectId, 'offline', error.message);
      return null;
    }
  }

  // Set up command handlers for a bot
  private setupCommandHandlers(bot: Bot, settings: any): void {
    // Start command
    bot.command('start', async (ctx) => {
      const welcomeMessage = settings.welcomeMessage || 
        "Welcome! I'm your bot assistant. Use /help to see available commands.";
      await ctx.reply(welcomeMessage);
    });

    // Help command
    bot.command('help', async (ctx) => {
      const helpMessage = settings.helpMessage || 
        "Available commands:\n/start - Start the bot\n/help - Show this help message\n/points - Check your points balance\n/rewards - View available rewards\n/profile - View your profile";
      await ctx.reply(helpMessage);
    });

    // Points command
    bot.command('points', async (ctx) => {
      // Look up user points
      const telegramId = ctx.from?.id.toString();
      if (!telegramId) return;

      try {
        const user = await db.telegramUser.findFirst({
          where: {
            telegramId,
            projectId: settings.projectId
          }
        });

        if (user) {
          await ctx.reply(`You have ${user.points || 0} points.`);
        } else {
          await ctx.reply("You don't have an account yet. Use /start to create one.");
        }
      } catch (error) {
        await ctx.reply("Sorry, I couldn't retrieve your points at this time.");
      }
    });

    // Add other commands based on your requirements
    bot.command('rewards', async (ctx) => {
      await ctx.reply("Here are the available rewards: [list of rewards]");
    });

    bot.command('profile', async (ctx) => {
      await ctx.reply("Here's your profile: [profile details]");
    });

    // Handle all messages (not just commands)
    bot.on('message', async (ctx) => {
      const messageText = ctx.message?.text;
      if (!messageText || messageText.startsWith('/')) return;

      // Process regular messages 
      await ctx.reply(`I received your message: "${messageText}". I'm a bot connected to this project.`);
    });
  }

  // Update bot status in the database
  private async updateBotStatus(projectId: string, status: 'online' | 'offline' | 'error', errorMessage?: string): Promise<void> {
    try {
      await db.telegramSettings.update({
        where: { projectId },
        data: {
          status,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Failed to update status for bot ${projectId}:`, error);
    }
  }

  // Get a webhook handler for a specific project ID
  public getWebhookHandler(projectId: string) {
    const bot = this.activeBots.get(projectId);
    if (!bot) {
      throw new Error(`Bot for project ${projectId} not found`);
    }
    return webhookCallback(bot, 'express');
  }

  // Stop and remove a bot
  public async removeBot(projectId: string): Promise<boolean> {
    try {
      const bot = this.activeBots.get(projectId);
      if (!bot) return false;

      // Stop the bot
      await bot.stop();
      
      // Remove webhook if exists
      const settings = await db.telegramSettings.findUnique({
        where: { projectId }
      });
      
      if (settings?.webhookUrl) {
        await bot.api.deleteWebhook();
      }
      
      // Remove from active bots
      this.activeBots.delete(projectId);
      
      // Update status in database
      await this.updateBotStatus(projectId, 'offline', 'Bot removed');
      
      return true;
    } catch (error) {
      console.error(`Error removing bot ${projectId}:`, error);
      return false;
    }
  }

  // Get all active bots
  public getActiveBots(): Map<string, Bot> {
    return this.activeBots;
  }

  // Check if a bot is active
  public isBotActive(projectId: string): boolean {
    return this.activeBots.has(projectId);
  }
}

// Export singleton instance
export default BotManager.getInstance();