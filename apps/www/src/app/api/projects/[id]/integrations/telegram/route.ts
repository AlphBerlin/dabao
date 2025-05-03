import { NextRequest, NextResponse } from 'next/server';

import { Bot } from 'grammy';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';


// Helper function to create a Telegram bot instance
const createBot = (token: string) => {
  try {
    return new Bot(token);
  } catch (error) {
    console.error('Error creating bot instance:', error);
    throw new Error('Invalid bot token');
  }
};

// GET route to fetch Telegram settings for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

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

    // Don't send sensitive information like bot token to the client directly
    // Instead, send a masked version
    const maskedSettings = {
      ...telegramSettings,
      botToken: telegramSettings.botToken.substring(0, 8) + '...' + telegramSettings.botToken.substring(telegramSettings.botToken.length - 4),
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
    const projectId = params.id;
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

    // Validate the token by trying to create a bot instance
    try {
      const bot = createBot(data.botToken);
      // Get bot info to validate token
      const botInfo = await bot.api.getMe();
      if (!botInfo) {
        throw new Error('Could not get bot information');
      }
      // Optional: validate that username matches
      if (botInfo.username !== data.botUsername) {
        return NextResponse.json(
          { error: 'Bot username does not match the provided token' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Bot token validation error:', error);
      return NextResponse.json(
        { error: 'Invalid bot token' },
        { status: 400 }
      );
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
        },
      });
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
        },
      });

      // Set up the bot using Grammy
      try {
        const bot = createBot(data.botToken);

        // Set up commands
        if (data.enableCommands) {
          await bot.api.setMyCommands([
            { command: "start", description: "Start the bot" },
            { command: "help", description: "Show help information" },
            { command: "points", description: "Check your points balance" },
            { command: "rewards", description: "View available rewards" },
            { command: "profile", description: "View your profile" },
          ]);
        }

        // Set webhook if provided
        if (data.webhookUrl) {
          await bot.api.setWebhook(data.webhookUrl);
        }
      } catch (error) {
        console.error('Error setting up bot:', error);
        // Continue despite setup errors - we can fix these later
      }
    }

    // Don't send sensitive information like bot token to the client directly
    const maskedSettings = {
      ...telegramSettings,
      botToken: telegramSettings.botToken.substring(0, 8) + '...' + telegramSettings.botToken.substring(telegramSettings.botToken.length - 4),
    };

    return NextResponse.json(maskedSettings);
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
    const projectId = params.id;

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

    // Optional: Clean up bot settings on Telegram side
    try {
      const bot = createBot(existingSettings.botToken);

      // Remove webhook if it was set
      if (existingSettings.webhookUrl) {
        await bot.api.deleteWebhook();
      }

      // Clear commands
      await bot.api.deleteMyCommands();
    } catch (error) {
      console.error('Error cleaning up bot settings:', error);
      // Continue despite cleanup errors
    }

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
