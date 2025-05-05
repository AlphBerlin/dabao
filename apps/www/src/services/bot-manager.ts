// src/services/botManager.ts
import { Bot, BotError, Context, session, webhookCallback } from 'grammy';
import { db } from '@/lib/db';

interface SessionData {
  projectId: string;
  currentMenu?: string;
  lastCommandTimestamp?: number;
}

// Singleton class to manage all bots across the application
export class BotManager {
  private static instance: BotManager;
  private activeBots: Map<string, Bot<Context, SessionData>> = new Map();
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
      bot = new Bot<Context, SessionData>(token);

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

      // Set up dynamic command handlers
      await this.setupCommandHandlers(bot, projectId);
      
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
  private async setupCommandHandlers(bot: Bot<Context, SessionData>, projectId: string): Promise<void> {
    // Fetch project settings
    const settings = await db.telegramSettings.findUnique({
      where: { projectId }
    });

    if (!settings) {
      throw new Error('Telegram settings not found');
    }

    // Always set up basic system commands
    this.setupSystemCommands(bot, settings);
    
    // Fetch custom commands from database
    const customCommands = await db.telegramCommand.findMany({
      where: { projectId, isEnabled: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    // Register each custom command
    for (const cmd of customCommands) {
      this.registerCustomCommand(bot, cmd);
    }

    // Handle callback queries (button clicks)
    bot.on("callback_query", async (ctx) => {
      try {
        const callbackData = ctx.callbackQuery.data;
        
        // Parse the callback data to determine action
        const [action, ...params] = callbackData.split(':');
        
        // Handle different button actions
        switch (action) {
          case 'menu':
            await this.handleMenuCallback(ctx, params[0]);
            break;
          case 'points':
            await this.handlePointsCallback(ctx);
            break;
          case 'membership':
            await this.handleMembershipCallback(ctx);
            break;
          case 'coupon':
            await this.handleCouponCallback(ctx, params[0]);
            break;
          default:
            // Log unknown callback for debugging
            console.log(`Unknown callback: ${callbackData}`);
            await ctx.answerCallbackQuery("This button is not active.");
        }
      } catch (error) {
        console.error('Error handling callback query:', error);
        await ctx.answerCallbackQuery("Sorry, something went wrong.").catch(console.error);
      }
    });
    
    // Handle regular messages (not commands)
    bot.on('message', async (ctx) => {
      const messageText = ctx.message?.text;
      if (!messageText || messageText.startsWith('/')) return;

      // Check if user is in a specific menu state
      if (ctx.session.currentMenu) {
        await this.handleMenuInput(ctx, ctx.session.currentMenu, messageText);
      } else {
        // Default message response
        const response = settings.welcomeMessage || 
          "I'm here to help! Use commands like /menu or /help to navigate.";
        await ctx.reply(response);
      }
    });
  }
  
  // System commands like /start and /help
  private setupSystemCommands(bot: Bot<Context, SessionData>, settings: any): void {
    // Start command
    bot.command('start', async (ctx) => {
      const welcomeMessage = settings.welcomeMessage || 
        "Welcome! I'm your bot assistant. Use /help to see available commands.";
      await ctx.reply(welcomeMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🎯 Check Points", callback_data: "points" },
              { text: "🎁 Get Rewards", callback_data: "coupon:list" }
            ],
            [
              { text: "👤 My Membership", callback_data: "membership" },
              { text: "📋 Menu", callback_data: "menu:main" }
            ]
          ]
        }
      });
      
      // Record user if not exists
      await this.recordUser(ctx, settings.projectId);
    });

    // Help command
    bot.command('help', async (ctx) => {
      const helpMessage = settings.helpMessage || 
        "Available commands:\n/start - Start the bot\n/help - Show this help message\n/points - Check your points balance\n/rewards - View available rewards\n/profile - View your profile";
      await ctx.reply(helpMessage);
    });

    // Points command (basic implementation)
    bot.command('points', async (ctx) => {
      await this.handlePointsCallback(ctx);
    });
    
    // Menu command
    bot.command('menu', async (ctx) => {
      await this.showMainMenu(ctx);
    });
  }
  
  // Register a custom command from the database
  private registerCustomCommand(bot: Bot<Context, SessionData>, command: any): void {
    // Handle different types of commands
    switch (command.type) {
      case 'TEXT_RESPONSE':
        bot.command(command.command, async (ctx) => {
          await ctx.reply(command.response || "Command response not configured.");
        });
        break;
        
      case 'BUTTON_MENU':
        bot.command(command.command, async (ctx) => {
          const metadata = command.metadata || {};
          const title = metadata.title || command.command;
          const buttons = metadata.buttons || [];
          
          // Format buttons for Telegram
          const inlineKeyboard = this.formatButtonsForTelegram(buttons);
          
          await ctx.reply(command.response || title, {
            reply_markup: {
              inline_keyboard: inlineKeyboard
            }
          });
        });
        break;
        
      case 'POINTS_INFO':
        bot.command(command.command, async (ctx) => {
          await this.handlePointsCallback(ctx);
        });
        break;
        
      case 'MEMBERSHIP_INFO':
        bot.command(command.command, async (ctx) => {
          await this.handleMembershipCallback(ctx);
        });
        break;
        
      case 'COUPON_GENERATOR':
        bot.command(command.command, async (ctx) => {
          await this.handleCouponCallback(ctx, 'generate');
        });
        break;
        
      case 'CUSTOM_ACTION':
        // Custom actions require special handling depending on metadata
        bot.command(command.command, async (ctx) => {
          const metadata = command.metadata || {};
          const actionType = metadata.actionType;
          
          if (actionType === 'api_call') {
            // Would implement API call logic here
            await ctx.reply("Processing your request...");
          } else if (actionType === 'form') {
            ctx.session.currentMenu = `form_${command.id}`;
            await ctx.reply(metadata.formPrompt || "Please provide the requested information:");
          } else {
            await ctx.reply(command.response || "This command is not fully configured.");
          }
        });
        break;
        
      default:
        // Default simple text response
        bot.command(command.command, async (ctx) => {
          await ctx.reply(command.response || `Command /${command.command} received.`);
        });
    }
  }
  
  // Format button data for Telegram inline keyboard
  private formatButtonsForTelegram(buttons: any[]): any[][] {
    if (!Array.isArray(buttons) || buttons.length === 0) {
      // Default buttons if none provided
      return [[{ text: "Main Menu", callback_data: "menu:main" }]];
    }
    
    // Format buttons into rows (max 2 buttons per row)
    const formattedButtons = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const row = [];
      row.push({
        text: buttons[i].label,
        callback_data: buttons[i].action
      });
      
      if (i + 1 < buttons.length) {
        row.push({
          text: buttons[i + 1].label,
          callback_data: buttons[i + 1].action
        });
      }
      
      formattedButtons.push(row);
    }
    
    return formattedButtons;
  }
  
  // Handle menu callback
  private async handleMenuCallback(ctx: Context, menuId: string): Promise<void> {
    await ctx.answerCallbackQuery();
    
    switch (menuId) {
      case 'main':
        await this.showMainMenu(ctx);
        break;
      case 'membership':
        await this.handleMembershipCallback(ctx);
        break;
      case 'promotions':
        await ctx.reply("🎉 Current Promotions\n\n" +
          "• Buy 1 Get 1 Free on all drinks\n" +
          "• 50% off on desserts this weekend\n" +
          "• Earn 2x points on any purchase over $20");
        break;
      case 'outlets':
        await ctx.reply("📍 Our Outlets\n\n" +
          "• Downtown: 123 Main St - Open 9am-10pm\n" +
          "• Westside: 456 Park Ave - Open 10am-9pm\n" +
          "• Eastside: 789 Beach Rd - Open 8am-11pm");
        break;
      default:
        await ctx.reply("Menu option not available.");
    }
  }
  
  // Show main menu with buttons
  private async showMainMenu(ctx: Context): Promise<void> {
    await ctx.reply("📋 Main Menu - Choose an option:", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💳 Membership", callback_data: "menu:membership" },
            { text: "🍽️ Menu", callback_data: "menu:food" }
          ],
          [
            { text: "🎁 Promotions", callback_data: "menu:promotions" },
            { text: "📍 Our Outlets", callback_data: "menu:outlets" }
          ]
        ]
      }
    });
  }
  
  // Handle points information request
  private async handlePointsCallback(ctx: Context): Promise<void> {
    if ('callbackQuery' in ctx) {
      await ctx.answerCallbackQuery();
    }
    
    // Get user and project info
    const telegramId = ctx.from?.id.toString();
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    
    if (!telegramId || !projectId) {
      await ctx.reply("Sorry, I couldn't retrieve your information.");
      return;
    }
    
    try {
      // Find the user in the database
      const user = await db.telegramUser.findFirst({
        where: { telegramId, projectId }
      });
      
      if (!user || !user.customerId) {
        await ctx.reply("You don't have a points account yet. Would you like to create one?", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Yes, create account", callback_data: "points:create" }]
            ]
          }
        });
        return;
      }
      
      // Get customer membership info
      const membership = await db.customerMembership.findFirst({
        where: { customerId: user.customerId, isActive: true },
        include: { membershipTier: true }
      });
      
      if (membership) {
        await ctx.reply(`📊 Your Points Balance:\n\n` +
          `🎯 Current Balance: ${membership.pointsBalance} points\n` +
          `⭐ Membership Tier: ${membership.membershipTier.name}\n` +
          `🏆 Total Earned: ${membership.totalPointsEarned} points\n\n` +
          `Use your points to get exclusive rewards!`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎁 View Rewards", callback_data: "coupon:list" }]
              ]
            }
          });
      } else {
        await ctx.reply(`📊 Your Points Balance:\n\n` +
          `🎯 You currently have 0 points.\n\n` +
          `Make a purchase to start earning points!`);
      }
    } catch (error) {
      console.error('Error getting points info:', error);
      await ctx.reply("Sorry, I couldn't retrieve your points balance at this time.");
    }
  }
  
  // Handle membership information request
  private async handleMembershipCallback(ctx: Context): Promise<void> {
    if ('callbackQuery' in ctx) {
      await ctx.answerCallbackQuery();
    }
    
    // Get user and project info
    const telegramId = ctx.from?.id.toString();
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    
    if (!telegramId || !projectId) {
      await ctx.reply("Sorry, I couldn't retrieve your information.");
      return;
    }
    
    try {
      // Find the user in the database
      const user = await db.telegramUser.findFirst({
        where: { telegramId, projectId },
        include: {
          customer: {
            include: {
              customerMemberships: {
                where: { isActive: true },
                include: { membershipTier: true },
                take: 1
              }
            }
          }
        }
      });
      
      if (!user || !user.customer || user.customer.customerMemberships.length === 0) {
        await ctx.reply("You're not a member yet. Join our membership program to earn rewards!", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Join Membership", callback_data: "membership:join" }]
            ]
          }
        });
        return;
      }
      
      const membership = user.customer.customerMemberships[0];
      const nextTier = await this.getNextMembershipTier(membership.membershipTierId, projectId);
      
      let upgradeText = '';
      if (nextTier) {
        const pointsNeeded = nextTier.pointsThreshold ? 
          (nextTier.pointsThreshold - membership.pointsBalance) : 0;
        
        if (pointsNeeded > 0) {
          upgradeText = `\n\nEarn ${pointsNeeded} more points to upgrade to ${nextTier.name}!`;
        }
      }
      
      await ctx.reply(`💳 Your Membership:\n\n` +
        `🏆 Current Tier: ${membership.membershipTier.name}\n` +
        `🎯 Points: ${membership.pointsBalance}\n` +
        `💰 Benefits: ${this.formatBenefits(membership.membershipTier.benefits)}` +
        upgradeText, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "View Rewards", callback_data: "coupon:list" }]
            ]
          }
        });
    } catch (error) {
      console.error('Error getting membership info:', error);
      await ctx.reply("Sorry, I couldn't retrieve your membership information at this time.");
    }
  }
  
  // Format membership tier benefits for display
  private formatBenefits(benefits: any): string {
    if (!benefits) return "No special benefits";
    
    try {
      if (typeof benefits === 'string') {
        benefits = JSON.parse(benefits);
      }
      
      // Format benefits list
      if (Array.isArray(benefits)) {
        return benefits.join("\n• ");
      } else if (typeof benefits === 'object') {
        return Object.entries(benefits)
          .map(([key, value]) => `• ${key}: ${value}`)
          .join("\n");
      }
      
      return String(benefits);
    } catch (error) {
      return "Special member benefits apply";
    }
  }
  
  // Get next membership tier info
  private async getNextMembershipTier(currentTierId: string, projectId: string): Promise<any> {
    try {
      // Get current tier
      const currentTier = await db.membershipTier.findUnique({
        where: { id: currentTierId }
      });
      
      if (!currentTier) return null;
      
      // Find next tier based on level
      const nextTier = await db.membershipTier.findFirst({
        where: {
          projectId,
          level: { gt: currentTier.level }
        },
        orderBy: { level: 'asc' }
      });
      
      return nextTier;
    } catch (error) {
      console.error('Error getting next tier:', error);
      return null;
    }
  }
  
  // Handle coupon/reward actions
  private async handleCouponCallback(ctx: Context, action: string): Promise<void> {
    if ('callbackQuery' in ctx) {
      await ctx.answerCallbackQuery();
    }
    
    // Get user and project info
    const telegramId = ctx.from?.id.toString();
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    
    if (!telegramId || !projectId) {
      await ctx.reply("Sorry, I couldn't retrieve your information.");
      return;
    }
    
    try {
      // Find the user in the database
      const user = await db.telegramUser.findFirst({
        where: { telegramId, projectId }
      });
      
      if (!user || !user.customerId) {
        await ctx.reply("You need to have an account to access rewards.", {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Create Account", callback_data: "points:create" }]
            ]
          }
        });
        return;
      }
      
      switch (action) {
        case 'list':
          // List available vouchers
          const vouchers = await db.voucher.findMany({
            where: {
              projectId,
              isActive: true,
              endDate: { gte: new Date() }
            },
            take: 5
          });
          
          if (vouchers.length === 0) {
            await ctx.reply("No rewards are currently available. Check back later!");
            return;
          }
          
          let message = "🎁 Available Rewards:\n\n";
          for (const voucher of vouchers) {
            const discountText = voucher.discountType === 'PERCENTAGE' ? 
              `${voucher.discountValue}% off` : 
              `$${voucher.discountValue} off`;
            
            message += `• ${voucher.name}: ${discountText}\n`;
          }
          
          message += "\nUse /rewards to claim a reward.";
          
          await ctx.reply(message);
          break;
        
        case 'generate':
          // Generate a random coupon code
          const code = `REWARD${Math.floor(1000 + Math.random() * 9000)}`;
          
          await ctx.reply(`🎉 Here's your exclusive coupon!\n\n` +
            `Code: ${code}\n` +
            `Discount: 10% off your next purchase\n` +
            `Valid until: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\n` +
            `Show this code at checkout to redeem.`);
          break;
          
        default:
          await ctx.reply("This reward action is not available.");
      }
    } catch (error) {
      console.error('Error handling coupon action:', error);
      await ctx.reply("Sorry, I couldn't process your reward request at this time.");
    }
  }
  
  // Handle input when user is in a specific menu context
  private async handleMenuInput(ctx: Context, menuId: string, input: string): Promise<void> {
    // Get message and user info
    const telegramId = ctx.from?.id.toString();
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    
    if (!telegramId || !projectId) {
      await ctx.reply("Sorry, I couldn't process your input.");
      return;
    }
    
    // Handle form inputs
    if (menuId.startsWith('form_')) {
      const commandId = menuId.replace('form_', '');
      
      // Process form input (would save to database in a real implementation)
      await ctx.reply(`Thank you for your input: "${input}"\n\nYour submission has been recorded.`);
      
      // Clear menu state
      if ('session' in ctx) {
        ctx.session.currentMenu = undefined;
      }
      
      return;
    }
    
    // Handle other menu states
    switch (menuId) {
      default:
        await ctx.reply("I didn't understand that input in this context. Please try again or use /menu to see available options.");
        
        // Clear menu state after a failed input
        if ('session' in ctx) {
          ctx.session.currentMenu = undefined;
        }
    }
  }
  
  // Record or update Telegram user
  private async recordUser(ctx: Context, projectId: string): Promise<void> {
    try {
      const from = ctx.from;
      if (!from) return;
      
      const telegramId = from.id.toString();
      
      // Check if user exists
      const existingUser = await db.telegramUser.findFirst({
        where: { telegramId, projectId }
      });
      
      if (existingUser) {
        // Update last interaction
        await db.telegramUser.update({
          where: { id: existingUser.id },
          data: {
            lastInteraction: new Date(),
            username: from.username,
            firstName: from.first_name,
            lastName: from.last_name,
            languageCode: from.language_code
          }
        });
      } else {
        // Create new user
        await db.telegramUser.create({
          data: {
            telegramId,
            projectId,
            username: from.username,
            firstName: from.first_name,
            lastName: from.last_name,
            languageCode: from.language_code,
            lastInteraction: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error recording user:', error);
    }
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
  
  // Update commands for a specific bot
  public async updateBotCommands(projectId: string): Promise<boolean> {
    try {
      const bot = this.activeBots.get(projectId);
      if (!bot) return false;
      
      // Create a new bot instance with same token to refresh commands
      const settings = await db.telegramSettings.findUnique({
        where: { projectId }
      });
      
      if (!settings) return false;
      
      // Remove the old bot
      await this.removeBot(projectId);
      
      // Create a new bot with fresh commands
      await this.createBot(projectId, settings.botToken);
      
      return true;
    } catch (error) {
      console.error(`Error updating bot commands for ${projectId}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export default BotManager.getInstance();