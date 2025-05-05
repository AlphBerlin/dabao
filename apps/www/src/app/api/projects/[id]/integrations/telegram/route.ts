// src/app/api/projects/[id]/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import botManager from '@/services/bot-manager';
import { Bot } from 'grammy';

// Helper function to validate a bot token
const validateBotToken = async (token: string, username: string) => {
  try {
    const bot = new Bot(token);
    const botInfo = await bot.api.getMe();
    
    if (!botInfo) {
      throw new Error('Could not get bot information');
    }
    
    // Validate that username matches
    if (botInfo.username !== username) {
      throw new Error('Bot username does not match the provided token');
    }
    
    return botInfo;
  } catch (error) {
    console.error('Bot token validation error:', error);
    throw error;
  }
};

// GET route to fetch Telegram settings for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const projectId = id;

    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch Telegram settings
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json(null, { status: 404 });
    }

    // Check bot status
    const isActive = botManager.isBotActive(projectId);

    // Return masked settings with status
    const maskedSettings = {
      ...telegramSettings,
      botToken: telegramSettings.botToken.substring(0, 8) + '...' + telegramSettings.botToken.substring(telegramSettings.botToken.length - 4),
      isActive,
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('Error fetching Telegram settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram settings' },
      { status: 500 }
    );
  }
}

// POST route to create or update Telegram settings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const projectId = id;
    const data = await request.json();

    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate required fields
    if (!data.botToken || !data.botUsername) {
      return NextResponse.json(
        { error: 'Bot token and username are required' },
        { status: 400 }
      );
    }

    // Validate the token
    try {
      await validateBotToken(data.botToken, data.botUsername);
    } catch (error) {
      return NextResponse.json(
        { error: `Invalid bot token: ${error.message}` },
        { status: 400 }
      );
    }

    // Generate a webhook URL if not provided
    if (!data.webhookUrl) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin');
      data.webhookUrl = `${baseUrl}/api/telegram/webhook/${projectId}`;
    }

    // Check if Telegram settings already exist for this project
    const existingSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    let telegramSettings;

    if (existingSettings) {
      // Update existing settings
      telegramSettings = await db.telegramSettings.update({
        where: { projectId },
        data: {
          botToken: data.botToken,
          botUsername: data.botUsername,
          webhookUrl: data.webhookUrl,
          welcomeMessage: data.welcomeMessage,
          helpMessage: data.helpMessage,
          enableCommands: data.enableCommands !== undefined ? data.enableCommands : true,
          status: 'pending',
          updatedAt: new Date()
        },
      });
      
      // Update or restart the bot
      if (botManager.isBotActive(projectId)) {
        await botManager.removeBot(projectId);
      }
    } else {
      // Create new settings
      telegramSettings = await db.telegramSettings.create({
        data: {
          projectId,
          botToken: data.botToken,
          botUsername: data.botUsername,
          webhookUrl: data.webhookUrl,
          welcomeMessage: data.welcomeMessage,
          helpMessage: data.helpMessage,
          enableCommands: data.enableCommands !== undefined ? data.enableCommands : true,
          status: 'pending',
          lastStatusChange: new Date()
        },
      });
    }

    // Initialize the bot with our manager
    try {
      await botManager.createBot(projectId, data.botToken);
      
      // Update status to show bot is active
      const isActive = botManager.isBotActive(projectId);
      
      // Return masked settings with status
      const maskedSettings = {
        ...telegramSettings,
        botToken: telegramSettings.botToken.substring(0, 8) + '...' + telegramSettings.botToken.substring(telegramSettings.botToken.length - 4),
        isActive,
      };

      return NextResponse.json(maskedSettings);
    } catch (error) {
      console.error('Error setting up bot:', error);
      
      // Return settings even if bot setup failed
      const maskedSettings = {
        ...telegramSettings,
        botToken: telegramSettings.botToken.substring(0, 8) + '...' + telegramSettings.botToken.substring(telegramSettings.botToken.length - 4),
        isActive: false,
        setupError: error.message
      };

      return NextResponse.json(maskedSettings);
    }
  } catch (error) {
    console.error('Error saving Telegram settings:', error);
    return NextResponse.json(
      { error: 'Failed to save Telegram settings' },
      { status: 500 }
    );
  }
}

// DELETE route to remove Telegram integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const projectId = id;
    
    // Check for authentication and authorization
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if the project exists and user has access
    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if Telegram settings exist
    const existingSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!existingSettings) {
      return NextResponse.json({ error: 'Telegram integration not found' }, { status: 404 });
    }

    // Remove the bot using our manager
    await botManager.removeBot(projectId);

    // Delete the Telegram settings
    await db.telegramSettings.delete({
      where: { projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Telegram integration:', error);
    return NextResponse.json(
      { error: 'Failed to delete Telegram integration' },
      { status: 500 }
    );
  }
}