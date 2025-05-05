import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { db } from "@/lib/db";

// Initialize Telegram bot (you'd typically do this in a more centralized place)
const botInstances = new Map<string, Bot>();

async function initTelegramBot(projectId: string) {
  try {
    // Check if we already have an instance for this project
    if (botInstances.has(projectId)) {
      return botInstances.get(projectId);
    }

    // Get the bot token from the database
    const integration = await db.telegramSettings.findUnique({
      where: { projectId },
      select: { botToken: true },
    });

    if (!integration || !integration.botToken) {
      throw new Error("Telegram integration not found or missing bot token");
    }

    // Initialize GrammY bot
    const bot = new Bot(integration.botToken);
    botInstances.set(projectId, bot);
    return bot;
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { projectId: string; userId: string } }
) {
  try {
    const { projectId, userId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Validate project access (implement your auth check here)
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Verify the Telegram user exists and belongs to the project
    const user = await db.telegramUser.findUnique({
      where: {
        id: userId,
        projectId,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Telegram user not found" },
        { status: 404 }
      );
    }

    // Fetch messages from the database that match this user
    const messages = await db.telegramMessage.findMany({
      where: {
        projectId,
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      orderBy: {
        sentAt: "asc",
      },
      take: limit,
      select: {
        id: true,
        content: true,
        senderId: true,
        recipientId: true,
        isFromUser: true,
        sentAt: true,
        mediaUrl: true,
      },
    });

    // Format messages for the client
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      senderId: msg.senderId || "bot",
      isFromBot: !msg.isFromUser,
      timestamp: msg.sentAt.toISOString(),
      mediaUrl: msg.mediaUrl,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching Telegram messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string; userId: string } }
) {
  try {
    const { projectId, userId } = params;
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Validate project access (implement your auth check here)
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Verify the Telegram user exists and belongs to the project
    const user = await db.telegramUser.findUnique({
      where: {
        id: userId,
        projectId,
      },
      select: {
        telegramId: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Telegram user not found" },
        { status: 404 }
      );
    }

    // Initialize the GrammY bot
    const bot = await initTelegramBot(projectId);
    if (!bot) {
      return NextResponse.json(
        { error: "Failed to initialize Telegram bot" },
        { status: 500 }
      );
    }

    // Send message to Telegram user using GrammY
    let telegramResponse;
    try {
      telegramResponse = await bot.api.sendMessage(user.telegramId, text);
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
      return NextResponse.json(
        { error: "Failed to send message to Telegram" },
        { status: 500 }
      );
    }

    // Save the message in the database using the schema structure
    const message = await db.telegramMessage.create({
      data: {
        projectId,
        telegramMsgId: telegramResponse.message_id.toString(),
        recipientId: userId, // The user receiving the message
        senderId: null, // Bot is sending, so no sender ID (or could be set to "bot")
        content: text,
        messageType: "TEXT",
        isFromUser: false, // Message is from bot to user
        isDelivered: true,
        sentAt: new Date(),
      },
      select: {
        id: true,
        content: true,
        senderId: true,
        recipientId: true,
        sentAt: true,
        isFromUser: true,
      },
    });

    // Format for response
    const formattedMessage = {
      id: message.id,
      text: message.content,
      senderId: "bot", 
      isFromBot: true,
      timestamp: message.sentAt.toISOString(),
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}