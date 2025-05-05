// src/services/botManager.ts
import { Bot, BotError, Context, session, webhookCallback, BotCommand } from 'grammy';
import { db } from '@/lib/db';

interface SessionData {
  projectId: string;
  currentMenu?: string;
  lastCommandTimestamp?: number;
  registrationData?: {
    step: string;
    email?: string;
    name?: string;
    phone?: string;
  };
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
    
    // Generate BotCommand array for Telegram's menu
    const botCommands: BotCommand[] = [];
    
    // Add system commands first
    botCommands.push({ command: 'start', description: 'Start the bot' });
    botCommands.push({ command: 'help', description: 'Show available commands' });
    botCommands.push({ command: 'menu', description: 'Show main menu' });
    
    console.log(`[Bot ${projectId}] Setting up ${customCommands.length} custom commands`);
    
    // Register each custom command
    for (const cmd of customCommands) {
      this.registerCustomCommand(bot, cmd);
      
      // Add to BotCommand array if enabled
      if (cmd.isEnabled) {
        botCommands.push({
          command: cmd.command,
          description: cmd.description
        });
      }
    }
    
    // Register commands with Telegram if enabled in settings
    if (settings.enableCommands) {
      try {
        await bot.api.setMyCommands(botCommands);
        console.log(`[Bot ${projectId}] Successfully registered ${botCommands.length} commands with Telegram`);
      } catch (error) {
        console.error(`[Bot ${projectId}] Failed to register commands with Telegram:`, error);
      }
    }

    // Pre-load menus from database
    await this.loadMenusFromDatabase(projectId);

    // Set up callbacks
    await this.setupCallbacks(bot);
    
    // Handle regular messages (not commands)
    bot.on('message', async (ctx) => {
      const messageText = ctx.message?.text;
      if (!messageText || messageText.startsWith('/')) return;

      // Record user message in the database
      await this.recordUserMessage(ctx);

      // Check if user is in a registration flow
      if (ctx.session.registrationData) {
        await this.handleRegistrationInput(ctx, messageText);
        return;
      }

      // Check if user is in a specific menu state
      if (ctx.session.currentMenu) {
        await this.handleMenuInput(ctx, ctx.session.currentMenu, messageText);
      } else {
        // Default message response
        const response = settings.welcomeMessage || 
          "I'm here to help! Use commands like /menu or /help to navigate.";
        await ctx.reply(response);
        
        // Record bot response
        await this.recordBotMessage(ctx, response);
      }
    });
  }

  // Private cache for menus
  private menuCache: Map<string, any[]> = new Map();

  // Load menus from database
  private async loadMenusFromDatabase(projectId: string): Promise<void> {
    try {
      // Fetch all menus for this project
      const menus = await db.telegramMenu.findMany({
        where: { projectId },
        orderBy: { sortOrder: 'asc' }
      });
      
      // Store in cache
      this.menuCache.set(projectId, menus);
      
      console.log(`[Bot ${projectId}] Loaded ${menus.length} menus from database`);

      // If no menus exist, create default ones
      if (menus.length === 0) {
        await this.createDefaultMenus(projectId);
      }
    } catch (error) {
      console.error(`Error loading menus for project ${projectId}:`, error);
    }
  }

  // Create default menus for a new project
  private async createDefaultMenus(projectId: string): Promise<void> {
    try {
      // Create main menu
      const mainMenu = await db.telegramMenu.create({
        data: {
          projectId,
          menuId: 'main',
          name: 'Main Menu',
          description: 'The main navigation menu',
          isDefault: true,
          sortOrder: 0,
          items: [
            { text: '💳 Membership', action: 'menu:membership' },
            { text: '🎯 Points', action: 'points' },
            { text: '🎁 Rewards', action: 'coupon:list' },
            { text: '📍 Locations', action: 'menu:locations' }
          ]
        }
      });
      
      // Create membership menu
      const membershipMenu = await db.telegramMenu.create({
        data: {
          projectId,
          menuId: 'membership',
          name: 'Membership Menu',
          description: 'Membership options and information',
          isDefault: false,
          sortOrder: 1,
          items: [
            { text: '💳 View My Status', action: 'membership' },
            { text: '🎯 Check Points', action: 'points' },
            { text: '📊 Benefits', action: 'menu:benefits' },
            { text: '🔙 Back to Main', action: 'menu:main' }
          ]
        }
      });
      
      // Create locations menu
      const locationsMenu = await db.telegramMenu.create({
        data: {
          projectId, 
          menuId: 'locations',
          name: 'Locations',
          description: 'Store locations',
          isDefault: false,
          sortOrder: 2,
          items: [
            { text: '🗺️ Find Nearest', action: 'location:nearest' },
            { text: '📍 All Locations', action: 'location:all' },
            { text: '🔙 Back to Main', action: 'menu:main' }
          ]
        }
      });
      
      // Add to cache
      this.menuCache.set(projectId, [mainMenu, membershipMenu, locationsMenu]);
      console.log(`[Bot ${projectId}] Created default menus`);
    } catch (error) {
      console.error(`Error creating default menus for project ${projectId}:`, error);
    }
  }

  // Get a menu from cache or database
  private async getMenu(projectId: string, menuId: string): Promise<any | null> {
    // Check cache first
    const cachedMenus = this.menuCache.get(projectId);
    if (cachedMenus) {
      const menu = cachedMenus.find(m => m.menuId === menuId);
      if (menu) return menu;
    }
    
    // If not in cache, try to fetch from database
    try {
      const menu = await db.telegramMenu.findFirst({
        where: { projectId, menuId }
      });
      
      if (menu) {
        // Update cache
        if (cachedMenus) {
          this.menuCache.set(projectId, [...cachedMenus.filter(m => m.menuId !== menuId), menu]);
        } else {
          this.menuCache.set(projectId, [menu]);
        }
        return menu;
      }
    } catch (error) {
      console.error(`Error fetching menu ${menuId} for project ${projectId}:`, error);
    }
    
    return null;
  }

  // Show a menu to a user
  private async showMenu(ctx: Context, menuId: string): Promise<void> {
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    if (!projectId) return;
    
    // Get menu from cache/database
    const menu = await this.getMenu(projectId, menuId);
    
    if (!menu) {
      // Fallback to main menu if requested menu doesn't exist
      if (menuId !== 'main') {
        await this.showMenu(ctx, 'main');
      } else {
        // If no main menu, show a default one
        await ctx.reply("📋 Menu", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "💳 Membership", callback_data: "membership" },
                { text: "🎯 Points", callback_data: "points" }
              ],
              [
                { text: "🎁 Rewards", callback_data: "coupon:list" },
                { text: "❓ Help", callback_data: "menu:help" }
              ]
            ]
          }
        });
      }
      return;
    }
    
    // Format the menu items for Telegram
    const buttons = this.formatMenuItemsForTelegram(menu.items);
    
    await ctx.reply(`📋 ${menu.name}`, {
      reply_markup: {
        inline_keyboard: buttons
      }
    });

    // Record bot message
    if ('from' in ctx) {
      await this.recordBotMessage(ctx, `Menu: ${menu.name}`);
    }
  }

  // Format menu items into Telegram keyboard buttons
  private formatMenuItemsForTelegram(items: any[]): any[][] {
    if (!Array.isArray(items) || items.length === 0) {
      // Default buttons if none provided
      return [[{ text: "Main Menu", callback_data: "menu:main" }]];
    }
    
    // Format buttons into rows (max 2 buttons per row)
    const formattedButtons = [];
    for (let i = 0; i < items.length; i += 2) {
      const row = [];
      row.push({
        text: items[i].text,
        callback_data: items[i].action
      });
      
      if (i + 1 < items.length) {
        row.push({
          text: items[i + 1].text,
          callback_data: items[i + 1].action
        });
      }
      
      formattedButtons.push(row);
    }
    
    return formattedButtons;
  }
  
  // Handle menu callback
  private async handleMenuCallback(ctx: Context, menuId: string): Promise<void> {
    await ctx.answerCallbackQuery();
    
    // Show the menu from the database
    await this.showMenu(ctx, menuId);
  }
  
  // Show main menu with buttons
  private async showMainMenu(ctx: Context): Promise<void> {
    await this.showMenu(ctx, 'main');
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
    try {
      console.log(`Registering command /${command.command} of type ${command.type}`);
      
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
    } catch (error) {
      console.error(`Error registering command /${command.command}:`, error);
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

      // Delete commands from Telegram menu
      try {
        await bot.api.deleteMyCommands();
      } catch (error) {
        console.error(`Error deleting commands for bot ${projectId}:`, error);
      }

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
      console.log(`Updating commands for bot ${projectId}`);
      
      // Get the bot instance
      const bot = this.activeBots.get(projectId);
      if (!bot) {
        console.error(`Bot ${projectId} not found for command update`);
        return false;
      }
      
      // Fetch project settings
      const settings = await db.telegramSettings.findUnique({
        where: { projectId }
      });
      
      if (!settings) {
        console.error(`No Telegram settings found for project ${projectId}`);
        return false;
      }
      
      // Get all commands for this project
      const customCommands = await db.telegramCommand.findMany({
        where: { projectId, isEnabled: true },
        orderBy: { sortOrder: 'asc' }
      });
      
      console.log(`Found ${customCommands.length} enabled commands for bot ${projectId}`);
      
      // Generate BotCommand array for Telegram's menu
      const botCommands: BotCommand[] = [];
      
      // Add system commands first
      botCommands.push({ command: 'start', description: 'Start the bot' });
      botCommands.push({ command: 'help', description: 'Show available commands' });
      botCommands.push({ command: 'menu', description: 'Show main menu' });
      
      // Process custom commands
      for (const cmd of customCommands) {
        // Re-register command handler
        this.registerCustomCommand(bot, cmd);
        
        // Add to command list
        botCommands.push({
          command: cmd.command,
          description: cmd.description
        });
      }
      
      // Register commands with Telegram if enabled
      if (settings.enableCommands) {
        try {
          // Update command list in Telegram
          await bot.api.setMyCommands(botCommands);
          console.log(`Successfully updated ${botCommands.length} commands with Telegram for bot ${projectId}`);
        } catch (error) {
          console.error(`Error setting commands with Telegram API for bot ${projectId}:`, error);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating bot commands for ${projectId}:`, error);
      return false;
    }
  }

  // Also update menus when updated in the database
  public async updateBotMenus(projectId: string): Promise<boolean> {
    try {
      console.log(`Updating menus for bot ${projectId}`);
      
      // Remove from cache to force reload
      this.menuCache.delete(projectId);
      
      // Load menus from database
      await this.loadMenusFromDatabase(projectId);
      
      return true;
    } catch (error) {
      console.error(`Error updating bot menus for ${projectId}:`, error);
      return false;
    }
  }

  // Handle all callback queries
  private async setupCallbacks(bot: Bot<Context, SessionData>): Promise<void> {
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
            if (params[0] === 'create') {
              await this.handleCreateAccount(ctx);
            } else {
              await this.handlePointsCallback(ctx);
            }
            break;
          case 'membership':
            if (params[0] === 'join') {
              await this.handleJoinMembership(ctx);
            } else {
              await this.handleMembershipCallback(ctx);
            }
            break;
          case 'coupon':
            await this.handleCouponCallback(ctx, params[0]);
            break;
          case 'register':
            await this.handleRegistrationStep(ctx, params[0]);
            break;
          case 'location':
            await this.handleLocationCallback(ctx, params[0]);
            break;
          default:
            // Log unknown callback for debugging
            console.log(`Unknown callback: ${callbackData}`);
            await ctx.answerCallbackQuery("This button is not active.");
        }

        // Record this message in the database for tracking
        await this.recordBotMessage(ctx, callbackData);
      } catch (error) {
        console.error('Error handling callback query:', error);
        await ctx.answerCallbackQuery("Sorry, something went wrong.").catch(console.error);
      }
    });
  }

  // Handle membership join process
  private async handleJoinMembership(ctx: Context): Promise<void> {
    if ('callbackQuery' in ctx && 'session' in ctx) {
      await ctx.answerCallbackQuery();

      // Initialize registration flow
      ctx.session.registrationData = {
        step: 'email'
      };

      await ctx.reply("Great! Let's set up your membership. I'll need a few details from you.");
      await ctx.reply("First, please enter your email address:");
    }
  }

  // Handle step-by-step registration
  private async handleRegistrationInput(ctx: Context, input: string): Promise<void> {
    if (!('session' in ctx)) return;
    
    const registrationData = ctx.session.registrationData;
    if (!registrationData) return;

    const telegramId = ctx.from?.id.toString();
    const projectId = ctx.session.projectId;
    
    if (!telegramId || !projectId) {
      await ctx.reply("Sorry, I couldn't process your registration.");
      return;
    }

    try {
      switch (registrationData.step) {
        case 'email':
          // Validate email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            await ctx.reply("That doesn't look like a valid email address. Please try again:");
            return;
          }
          
          // Store email and move to next step
          registrationData.email = input;
          registrationData.step = 'name';
          await ctx.reply("Thanks! Now, please enter your full name:");
          break;
        
        case 'name':
          // Store name and move to next step
          registrationData.name = input;
          registrationData.step = 'phone';
          await ctx.reply("Great! Finally, please enter your phone number (optional, you can type 'skip' to skip this step):");
          break;
        
        case 'phone':
          // Store phone number
          if (input.toLowerCase() !== 'skip') {
            registrationData.phone = input;
          }
          
          // Complete registration
          await this.completeRegistration(ctx);
          break;
      }
    } catch (error) {
      console.error('Error processing registration input:', error);
      await ctx.reply("Sorry, there was an error processing your input. Please try again or contact support.");
    }
  }

  // Complete registration process
  private async completeRegistration(ctx: Context): Promise<void> {
    if (!('session' in ctx)) return;
    
    const registrationData = ctx.session.registrationData;
    if (!registrationData || !registrationData.email) {
      await ctx.reply("Sorry, we couldn't complete your registration. Please try again later.");
      return;
    }

    const telegramId = ctx.from?.id.toString();
    const projectId = ctx.session.projectId;
    
    try {
      // Find telegram user
      const telegramUser = await db.telegramUser.findFirst({
        where: { telegramId, projectId }
      });

      if (!telegramUser) {
        await ctx.reply("Sorry, we couldn't find your user account. Please try again later.");
        return;
      }

      // Check if a customer with this email already exists
      let customer = await db.customer.findFirst({
        where: { 
          projectId,
          email: registrationData.email
        }
      });

      // Create customer if not exists
      if (!customer) {
        customer = await db.customer.create({
          data: {
            projectId,
            email: registrationData.email,
            name: registrationData.name,
            phone: registrationData.phone,
          }
        });
      }

      // Link customer to telegram user if not already linked
      if (!telegramUser.customerId) {
        await db.telegramUser.update({
          where: { id: telegramUser.id },
          data: { customerId: customer.id }
        });
      }

      // Find the lowest membership tier to assign
      const lowestTier = await db.membershipTier.findFirst({
        where: { projectId },
        orderBy: { level: 'asc' }
      });

      if (!lowestTier) {
        await ctx.reply("Thanks for registering! However, no membership tiers are available at the moment. We'll set up your membership soon.");
        return;
      }

      // Check if customer already has a membership
      const existingMembership = await db.customerMembership.findFirst({
        where: { 
          customerId: customer.id,
          isActive: true
        }
      });

      if (!existingMembership) {
        // Create new membership
        await db.customerMembership.create({
          data: {
            customerId: customer.id,
            membershipTierId: lowestTier.id,
            pointsBalance: 0,
            totalPointsEarned: 0
          }
        });
      }

      // Clear registration data
      ctx.session.registrationData = undefined;

      // Show success message
      await ctx.reply(`🎉 Congratulations! Your membership has been created successfully!\n\nWelcome to our loyalty program. You've been enrolled in our ${lowestTier.name} tier.`, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "View My Membership", callback_data: "membership" }],
            [{ text: "Check Points Balance", callback_data: "points" }]
          ]
        }
      });

      // Create customer activity record
      await db.customerActivity.create({
        data: {
          customerId: customer.id,
          type: 'registration',
          description: 'Registered via Telegram Bot',
          pointsEarned: 0,
          metadata: { source: 'telegram' }
        }
      });
    } catch (error) {
      console.error('Error completing registration:', error);
      await ctx.reply("Sorry, we couldn't complete your registration. Please try again later or contact support.");
    }
  }

  // Record user message for tracking
  private async recordUserMessage(ctx: Context): Promise<void> {
    if (!ctx.message?.text) return;
    
    const telegramId = ctx.from?.id.toString();
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    
    if (!telegramId || !projectId) return;
    
    try {
      // Find telegram user or create if not exists
      const telegramUser = await this.findOrCreateTelegramUser(telegramId, projectId, ctx.from);
      
      if (!telegramUser) return;
      
      // Record the message
      await db.telegramMessage.create({
        data: {
          projectId,
          senderId: telegramUser.id,
          telegramMsgId: ctx.message.message_id.toString(),
          messageType: 'TEXT',
          content: ctx.message.text,
          isFromUser: true,
          isDelivered: true,
          isRead: true,
          sentAt: new Date(),
          deliveredAt: new Date(),
          readAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording user message:', error);
    }
  }

  // Record bot message for tracking
  private async recordBotMessage(ctx: Context, content: string): Promise<void> {
    const telegramId = ctx.from?.id.toString();
    const projectId = 'session' in ctx ? ctx.session.projectId : '';
    
    if (!telegramId || !projectId) return;
    
    try {
      // Find telegram user
      const telegramUser = await db.telegramUser.findFirst({
        where: { telegramId, projectId }
      });
      
      if (!telegramUser) return;
      
      // Record the message
      await db.telegramMessage.create({
        data: {
          projectId,
          recipientId: telegramUser.id,
          messageType: 'TEXT',
          content: content,
          isFromUser: false,
          isDelivered: true,
          sentAt: new Date(),
          deliveredAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording bot message:', error);
    }
  }

  // Find or create telegram user
  private async findOrCreateTelegramUser(telegramId: string, projectId: string, from: any): Promise<any> {
    try {
      // Check if user exists
      let telegramUser = await db.telegramUser.findFirst({
        where: { telegramId, projectId }
      });
      
      if (telegramUser) {
        // Update last interaction
        return await db.telegramUser.update({
          where: { id: telegramUser.id },
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
        return await db.telegramUser.create({
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
      console.error('Error finding or creating user:', error);
      return null;
    }
  }

  // Handle registration steps from button clicks
  private async handleRegistrationStep(ctx: Context, step: string): Promise<void> {
    if (!('session' in ctx)) return;
    
    // Handle registration navigation
    switch (step) {
      case 'email':
        ctx.session.registrationData = { step: 'email' };
        await ctx.reply("Please enter your email address:");
        break;
      
      case 'cancel':
        ctx.session.registrationData = undefined;
        await ctx.reply("Registration cancelled. You can join membership anytime by clicking the Join Membership button.");
        break;
      
      default:
        await ctx.reply("Invalid registration step. Please try again.");
    }
  }
  
  // Handle account creation (points account)
  private async handleCreateAccount(ctx: Context): Promise<void> {
    if ('callbackQuery' in ctx) {
      await ctx.answerCallbackQuery();
    }
    
    // This now redirects to the membership join process
    await this.handleJoinMembership(ctx);
  }

  // Handle location-related callbacks
  private async handleLocationCallback(ctx: Context, action: string): Promise<void> {
    await ctx.answerCallbackQuery();
    
    switch (action) {
      case 'nearest':
        await ctx.reply("To find the nearest location, please share your location using the button below:", {
          reply_markup: {
            keyboard: [
              [{ text: "📍 Share My Location", request_location: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
        break;
        
      case 'all':
        await ctx.reply("📍 Our Locations:\n\n" +
          "• Downtown: 123 Main St - Open 9am-10pm\n" +
          "• Westside: 456 Park Ave - Open 10am-9pm\n" +
          "• Eastside: 789 Beach Rd - Open 8am-11pm", {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🔙 Back to Locations", callback_data: "menu:locations" }]
              ]
            }
          });
        break;
        
      default:
        await ctx.reply("I couldn't process that location request.");
    }
  }
}

// Export singleton instance
export default BotManager.getInstance();