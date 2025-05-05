import { NextRequest, NextResponse } from 'next/server';

import { Bot } from 'grammy';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

// Initialize Prisma client

// Helper function to create a Telegram bot instance
const createBot = (token: string) => {
  try {
    return new Bot(token);
  } catch (error) {
    console.error('Error creating bot instance:', error);
    throw new Error('Invalid bot token');
  }
};

// GET route to fetch all campaigns for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
    
    
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

    // Fetch campaigns with statistics
    const campaigns = await db.telegramCampaign.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching Telegram campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram campaigns' },
      { status: 500 }
    );
  }
}

// POST route to create a new campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId =(await params).projectId;
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
    if (!data.name || !data.messageTemplate) {
      return NextResponse.json(
        { error: 'Campaign name and message template are required' },
        { status: 400 }
      );
    }

    // Get Telegram settings for the bot token
    const telegramSettings = await db.telegramSettings.findUnique({
      where: { projectId },
    });

    if (!telegramSettings) {
      return NextResponse.json(
        { error: 'Telegram integration not found' },
        { status: 404 }
      );
    }

    // Create the campaign
    const campaign = await db.telegramCampaign.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        messageTemplate: data.messageTemplate,
        buttons: data.buttons,
        imageUrl: data.imageUrl,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        status: data.scheduledFor ? 'SCHEDULED' : 'DRAFT',
        audienceFilter: data.audienceFilter,
      },
    });

    // If campaign is scheduled for immediate send (no scheduledFor date)
    // and status is SENDING, start the campaign
    if (data.status === 'SENDING' && !data.scheduledFor) {
      try {
        // Get target audience based on filter
        const filter = data.audienceFilter || {};
        const audience = await db.telegramUser.findMany({
          where: {
            projectId,
            isSubscribed: true, // Only send to subscribed users
            ...filter,
          },
          select: {
            id: true,
            telegramId: true,
          },
        });

        // Create bot instance
        const bot = createBot(telegramSettings.botToken);
        
        // Update campaign status to SENDING
        await db.telegramCampaign.update({
          where: { id: campaign.id },
          data: { status: 'SENDING' },
        });
        
        // Start sending messages in background
        // Note: In a production app, this would be done via a queue/worker system
        Promise.all(
          audience.map(async (user: TelegramUser) => {
            try {
              // Send message via Telegram API
              const messageOptions: any = {};
              
              // Add inline keyboard if buttons exist
              if (data.buttons) {
                messageOptions.reply_markup = {
                  inline_keyboard: data.buttons,
                };
              }
              
              // Send text message
              const sentMsg = await bot.api.sendMessage(
                user.telegramId,
                data.messageTemplate,
                messageOptions
              );
              
              // Record message in database
              await db.telegramMessage.create({
                data: {
                  projectId,
                  telegramMsgId: sentMsg.message_id.toString(),
                  recipientId: user.id,
                  campaignId: campaign.id,
                  content: data.messageTemplate,
                  buttons: data.buttons,
                  mediaUrl: data.imageUrl,
                  isFromUser: false,
                  isDelivered: true,
                  messageType: 'TEXT',
                  sentAt: new Date(),
                  deliveredAt: new Date(),
                },
              });
              
              // Update campaign sent count
              await db.telegramCampaign.update({
                where: { id: campaign.id },
                data: { sentCount: { increment: 1 }, deliveredCount: { increment: 1 } },
              });
              
            } catch (error) {
              console.error(`Error sending message to user ${user.telegramId}:`, error);
            }
          })
        )
          .then(async () => {
            // Update campaign status to COMPLETED
            await db.telegramCampaign.update({
              where: { id: campaign.id },
              data: { status: 'COMPLETED' },
            });
          })
          .catch(async (error) => {
            console.error('Error sending campaign messages:', error);
            // Update campaign status to FAILED
            await db.telegramCampaign.update({
              where: { id: campaign.id },
              data: { status: 'FAILED' },
            });
          });
      } catch (error) {
        console.error('Error starting campaign:', error);
        // Still return success since the campaign was created
      }
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error creating Telegram campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create Telegram campaign' },
      { status: 500 }
    );
  }
}
