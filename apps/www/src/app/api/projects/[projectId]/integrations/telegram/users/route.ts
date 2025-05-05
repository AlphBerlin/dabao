import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { db } from "@/lib/db";

// Initialize Telegram bot (shared across routes)
async function getTelegramBot(projectId: string) {
  try {
    const settings = await db.telegramSettings.findUnique({
      where: { projectId },
      select: { botToken: true, botUsername: true },
    });

    if (!settings || !settings.botToken) {
      throw new Error("Telegram integration not configured");
    }

    // Initialize GrammY bot
    return new Bot(settings.botToken);
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    
    const { projectId } = await params;

    // Validate project access (implement your auth check here)
    // const session = await getServerSession(authOptions);
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Build the query
    let whereClause: any = {
      projectId,
    };

    // Apply search filter
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    // Apply status filter
    if (filter === "subscribed") {
      whereClause.isSubscribed = true;
    } else if (filter === "unsubscribed") {
      whereClause.isSubscribed = false;
    } else if (filter === "linked") {
      whereClause.customerId = { not: null };
      whereClause.hasLinkedCustomer = true;
    } else if (filter === "unlinked") {
      whereClause.customerId = null;
      whereClause.hasLinkedCustomer = false;
    }

    // Fetch users from database with last message info
    const users = await db.telegramUser.findMany({
      where: whereClause,
      orderBy: {
        lastInteraction: "desc",
      },
      include: {
        // Get the most recent message for each user
        receivedMessages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
          select: {
            content: true,
            sentAt: true,
            isRead: true,
          },
        },
      },
    });

    // Format users for response, adding hasLinkedCustomer if it doesn't exist
    const formattedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      isSubscribed: user.isSubscribed,
      subscribedAt: user.subscribedAt,
      unsubscribedAt: user.unsubscribedAt,
      lastInteraction: user.lastInteraction,
      hasLinkedCustomer: user.customerId !== null, // Derive from customerId if not available directly
      photoUrl: null, // If photoUrl is stored elsewhere
      lastMessage: user.receivedMessages.length > 0 ? {
        content: user.receivedMessages[0].content,
        sentAt: user.receivedMessages[0].sentAt,
        isRead: user.receivedMessages[0].isRead,
      } : null,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching Telegram users:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram users" },
      { status: 500 }
    );
  }
}

// Add API to get a user's chat profile picture using GrammY
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

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
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get bot instance
    const bot = await getTelegramBot(projectId);
    if (!bot) {
      return NextResponse.json(
        { error: "Could not initialize Telegram bot" },
        { status: 500 }
      );
    }

    // Fetch user profile photos using GrammY
    try {
      const photos = await bot.api.getUserProfilePhotos(user.telegramId, { limit: 1 });
      
      if (photos && photos.total_count > 0) {
        const photo = photos.photos[0][0]; // Get the first photo, highest quality
        const file = await bot.api.getFile(photo.file_id);
        
        // Construct photo URL - for GrammY, you'd need your bot token
        const settings = await db.telegramSettings.findUnique({
          where: { projectId },
          select: { botToken: true },
        });
        
        if (settings?.botToken && file.file_path) {
          const photoUrl = `https://api.telegram.org/file/bot${settings.botToken}/${file.file_path}`;
          
          // Update the user with the photo URL
          await db.telegramUser.update({
            where: { id: userId },
            data: { photoUrl },
          });
          
          return NextResponse.json({ photoUrl });
        }
      }
      
      return NextResponse.json({ photoUrl: null });
    } catch (error) {
      console.error("Error fetching user profile photo:", error);
      return NextResponse.json(
        { error: "Failed to fetch user profile photo" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}