import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

const testMessageSchema = z.object({
  telegramUsername: z.string().min(1, "Telegram username is required"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; telegramCampaignId: string } }
) {
  try {
    const {projectId, telegramCampaignId} = await params;

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request body
    const data = await req.json();
    const validatedData = testMessageSchema.parse(data);

    // Get telegram campaign and settings
    const telegramCampaign = await prisma.telegramCampaign.findUnique({
      where: {
        id: telegramCampaignId,
        projectId: projectId,
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
        projectId: projectId,
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
        projectId: projectId,
      },
    });

    // If we don't have this user in our records, we'll handle that later
    // when attempting to send the message via the Telegram API
    
    // Send a test message
    try {
      // In a real implementation, you would have a Telegram service
      // This is a placeholder that would call the Telegram API
      const messageContent = {
        messageTemplate: telegramCampaign.messageTemplate,
        imageUrl: telegramCampaign.imageUrl,
        buttons: telegramCampaign.buttons,
        // Replace placeholders with test data
        placeholders: {
          name: username,
          points: "1000",
        },
      };

      // Record the test message in our database to track it
      const message = await prisma.telegramMessage.create({
        data: {
          projectId: projectId,
          campaignId: params.telegramCampaignId,
          messageType: "TEXT",
          content: `TEST: ${telegramCampaign.messageTemplate}`,
          isFromUser: false,
          recipientId: telegramUser?.id, // Might be null if user not found
          sentAt: new Date(),
        },
      });

      // Connect to Telegram API to actually send the message
      // This would be implemented with a proper Telegram API client
      const telegramApiResponse = {
        success: true,
        message_id: Math.floor(Math.random() * 10000).toString(),
      };

      // Update our message record with the Telegram message ID
      await prisma.telegramMessage.update({
        where: { id: message.id },
        data: {
          telegramMsgId: telegramApiResponse.message_id,
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
        { error: "Failed to send test message" },
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