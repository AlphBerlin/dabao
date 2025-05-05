import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";
import { TelegramService } from "@/lib/services/telegram";

const testMessageSchema = z.object({
  telegramUsername: z.string().min(1, "Telegram username is required"),
});

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

    // Validate request body
    const data = await req.json();
    const validatedData = testMessageSchema.parse(data);

    // Get telegram campaign and settings
    const telegramCampaign = await prisma.telegramCampaign.findUnique({
      where: {
        id: params.telegramCampaignId,
        projectId: params.projectId,
      },
    });

    if (!telegramCampaign) {
      return NextResponse.json(
        { error: "Telegram campaign not found" },
        { status: 404 }
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

    // Remove @ from username if present
    const username = validatedData.telegramUsername.startsWith('@') 
      ? validatedData.telegramUsername.slice(1) 
      : validatedData.telegramUsername;

    // Check if user exists in our records
    let telegramUser = await prisma.telegramUser.findFirst({
      where: {
        username: username,
        projectId: params.projectId,
      },
    });

    // Initialize Telegram service
    const telegramService = new TelegramService(telegramSettings.botToken);
    
    // Handle the chat_id - this is critical for the API call to work
    let chat_id: string | number | undefined;
    
    // Try different methods to find the chat ID
    try {
      if (telegramUser?.chatId) {
        // If we have a stored chat ID, validate it first by sending a simple typing action
        try {
          await telegramService.makeRequest('sendChatAction', {
            chat_id: telegramUser.chatId,
            action: 'typing'
          });
          
          // If no error was thrown, the chat_id is valid
          chat_id = telegramUser.chatId;
          console.log(`Using existing chat_id: ${chat_id} for user ${username}`);
        } catch (error) {
          console.log(`Stored chat_id ${telegramUser.chatId} for user ${username} is invalid. Trying to find a new one.`);
          // If stored chat_id isn't valid, we'll continue to next method
        }
      }
      
      // If we still don't have a valid chat_id, try to find by username
      if (!chat_id) {
        console.log(`Looking up user ${username} via bot updates...`);
        const userInfo = await telegramService.getChatMember(`@${username}`);
        
        if (userInfo?.result?.user?.id) {
          chat_id = userInfo.result.user.id;
          console.log(`Found chat_id ${chat_id} for user ${username} via updates`);
          
          // Store or update this chat ID for future use
          if (telegramUser) {
            await prisma.telegramUser.update({
              where: { id: telegramUser.id },
              data: { chatId: chat_id.toString() }
            });
          } else {
            // Create a new user record
            telegramUser = await prisma.telegramUser.create({
              data: {
                projectId: params.projectId,
                username,
                chatId: chat_id.toString(),
                isActive: true,
              }
            });
          }
        }
      }
      
      // If we still don't have a chat_id, the user hasn't interacted with the bot
      if (!chat_id) {
        return NextResponse.json(
          { 
            error: `Could not find chat ID for @${username}. Please ensure that:
            1. The username is spelled correctly.
            2. The user has sent at least one message to your bot.
            3. The bot hasn't been blocked by the user.`
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error("Error resolving chat ID:", error);
      return NextResponse.json(
        { 
          error: `Unable to resolve chat ID for @${username}. Reason: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        },
        { status: 400 }
      );
    }
    
    try {
      // Create message with test placeholders
      const messageContent = telegramService.replacePlaceholders(
        telegramCampaign.messageTemplate,
        {
          name: username,
          points: "1000",
          date: new Date().toLocaleDateString(),
          // Add other common placeholders as needed
        }
      );

      // Record the test message in our database to track it
      const message = await prisma.telegramMessage.create({
        data: {
          projectId: params.projectId,
          campaignId: params.telegramCampaignId,
          messageType: "TEXT",
          content: `TEST: ${telegramCampaign.messageTemplate}`,
          isFromUser: false,
          recipientId: telegramUser?.id, // Might be null if user not found
          sentAt: new Date(),
        },
      });

      // Process buttons if present
      let replyMarkup = undefined;
      if (telegramCampaign.buttons && telegramCampaign.buttons.length > 0) {
        // Format buttons for Telegram
        const inlineKeyboard = telegramCampaign.buttons.map(button => [
          {
            text: button.text,
            ...(button.url ? { url: button.url } : {}),
            ...(button.callbackData ? { callback_data: button.callbackData } : {}),
          }
        ]);
        
        replyMarkup = telegramService.createInlineKeyboard(inlineKeyboard);
      }

      // Send message to Telegram
      let telegramApiResponse;
      
      // If image is included, send as photo with caption
      if (telegramCampaign.imageUrl) {
        telegramApiResponse = await telegramService.sendPhoto({
          chat_id,
          photo: telegramCampaign.imageUrl,
          caption: messageContent,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        });
      } else {
        // Send as text message
        telegramApiResponse = await telegramService.sendMessage({
          chat_id,
          text: messageContent,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
          disable_web_page_preview: false,
        });
      }

      // Update our message record with the Telegram message ID
      await prisma.telegramMessage.update({
        where: { id: message.id },
        data: {
          telegramMsgId: telegramApiResponse.result?.message_id?.toString(),
          isDelivered: true,
          deliveredAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Test message sent successfully",
      });
    } catch (error) {
      console.error("Error sending test message:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to send test message" },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error sending test message:", error);
    return NextResponse.json(
      { error: "Failed to send test message" },
      { status: 500 }
    );
  }
}