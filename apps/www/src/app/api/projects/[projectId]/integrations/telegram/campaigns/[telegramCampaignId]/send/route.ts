import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";
import { TelegramService } from "@/lib/services/telegram";

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; telegramCampaignId: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(user.id, params.projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get telegram campaign and settings
    const telegramCampaign = await prisma.telegramCampaign.findUnique({
      where: {
        id: params.telegramCampaignId,
        projectId: params.projectId,
      },
      include: {
        campaign: true, // Include parent campaign
      }
    });

    if (!telegramCampaign) {
      return NextResponse.json(
        { error: "Telegram campaign not found" },
        { status: 404 }
      );
    }

    // Check if campaign is in a valid state to be sent
    if (telegramCampaign.status === 'SENDING' || telegramCampaign.status === 'COMPLETED') {
      return NextResponse.json(
        { error: "Campaign has already been sent or is currently sending" },
        { status: 400 }
      );
    }

    const telegramSettings = await prisma.telegramSettings.findUnique({
      where: {
        projectId: params.projectId,
      },
    });

    if (!telegramSettings || !telegramSettings.botToken) {
      return NextResponse.json(
        { error: "Telegram settings not configured" },
        { status: 400 }
      );
    }

    // Update campaign status to SENDING
    await prisma.telegramCampaign.update({
      where: {
        id: params.telegramCampaignId,
      },
      data: {
        status: 'SENDING',
        sentAt: new Date(),
      },
    });

    // Also update the main campaign status
    if (telegramCampaign.campaign) {
      await prisma.campaign.update({
        where: {
          id: telegramCampaign.campaign.id,
        },
        data: {
          status: 'ACTIVE',
        },
      });
    }

    // Get all Telegram users for this project
    // We could apply audience filters here based on telegramCampaign.audienceFilter
    const telegramUsers = await prisma.telegramUser.findMany({
      where: {
        projectId: params.projectId,
        isActive: true,
        chatId: { not: null }, // Make sure we have a chat ID
      },
    });

    if (telegramUsers.length === 0) {
      await prisma.telegramCampaign.update({
        where: {
          id: params.telegramCampaignId,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          sentCount: 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Campaign completed with 0 recipients (no subscribers found)",
      });
    }

    // Initialize Telegram service
    const telegramService = new TelegramService(telegramSettings.botToken);
    
    // Send messages (preferably in batches to avoid Telegram API limits)
    const batchSize = 10; // Adjust based on your needs and Telegram API limits
    const totalUsers = telegramUsers.length;
    let sentCount = 0;
    let deliveredCount = 0;
    let errorCount = 0;

    for (let i = 0; i < totalUsers; i += batchSize) {
      const batch = telegramUsers.slice(i, i + batchSize);
      
      // Process each user in the batch
      await Promise.allSettled(batch.map(async (user) => {
        try {
          // Replace placeholders with user data
          const messageContent = telegramService.replacePlaceholders(
            telegramCampaign.messageTemplate,
            {
              name: user.firstName || user.username || 'there',
              points: user.points?.toString() || '0',
              date: new Date().toLocaleDateString(),
              // Add more placeholders as needed
            }
          );

          // Process buttons if present
          let replyMarkup = undefined;
          if (telegramCampaign.buttons && telegramCampaign.buttons.length > 0) {
            const inlineKeyboard = telegramCampaign.buttons.map(button => [
              {
                text: button.text,
                ...(button.url ? { url: button.url } : {}),
                ...(button.callbackData ? { callback_data: button.callbackData } : {}),
              }
            ]);
            
            replyMarkup = telegramService.createInlineKeyboard(inlineKeyboard);
          }

          // Record the message in our database
          const message = await prisma.telegramMessage.create({
            data: {
              projectId: params.projectId,
              campaignId: params.telegramCampaignId,
              messageType: telegramCampaign.imageUrl ? "PHOTO" : "TEXT",
              content: telegramCampaign.messageTemplate,
              isFromUser: false,
              recipientId: user.id,
              sentAt: new Date(),
            },
          });

          // Send message to Telegram
          let telegramApiResponse;
          
          if (telegramCampaign.imageUrl) {
            telegramApiResponse = await telegramService.sendPhoto({
              chat_id: user.chatId as string,
              photo: telegramCampaign.imageUrl,
              caption: messageContent,
              parse_mode: 'HTML',
              reply_markup: replyMarkup,
            });
          } else {
            telegramApiResponse = await telegramService.sendMessage({
              chat_id: user.chatId as string,
              text: messageContent,
              parse_mode: 'HTML',
              reply_markup: replyMarkup,
              disable_web_page_preview: false,
            });
          }

          // Update message record with Telegram message ID
          await prisma.telegramMessage.update({
            where: { id: message.id },
            data: {
              telegramMsgId: telegramApiResponse.result?.message_id.toString(),
              isDelivered: true,
              deliveredAt: new Date(),
            },
          });

          sentCount++;
          deliveredCount++;
        } catch (error) {
          console.error(`Error sending message to user ${user.id}:`, error);
          errorCount++;
          sentCount++;
        }
      }));

      // Update campaign status periodically to show progress
      if (i % 50 === 0 || i + batchSize >= totalUsers) {
        await prisma.telegramCampaign.update({
          where: {
            id: params.telegramCampaignId,
          },
          data: {
            sentCount,
            deliveredCount,
            errorCount,
            // If we've finished, mark as completed
            ...(i + batchSize >= totalUsers ? { 
              status: 'COMPLETED',
              completedAt: new Date() 
            } : {})
          },
        });
      }

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < totalUsers) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final update to mark campaign as completed
    await prisma.telegramCampaign.update({
      where: {
        id: params.telegramCampaignId,
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        sentCount,
        deliveredCount,
        errorCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign sent successfully",
      stats: {
        totalUsers,
        sentCount,
        deliveredCount,
        errorCount,
      }
    });
  } catch (error) {
    console.error("Error sending campaign:", error);
    
    // If there was an error, update the campaign status
    await prisma.telegramCampaign.update({
      where: {
        id: params.telegramCampaignId,
      },
      data: {
        status: 'FAILED',
      },
    }).catch(err => console.error("Failed to update campaign status:", err));

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send campaign" },
      { status: 500 }
    );
  }
}