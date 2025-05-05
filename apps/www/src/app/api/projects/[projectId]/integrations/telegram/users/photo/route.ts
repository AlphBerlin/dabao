import { NextResponse } from "next/server";
import { Bot } from "grammy";
import { db } from "@/lib/db";

// Cache to reduce bot token fetching
const botTokenCache: Record<string, { token: string, expires: number }> = {};
const BOT_TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get bot token with caching
async function getBotToken(projectId: string): Promise<string | null> {
  // Check cache first
  if (botTokenCache[projectId] && Date.now() < botTokenCache[projectId].expires) {
    return botTokenCache[projectId].token;
  }

  try {
    const settings = await db.telegramSettings.findUnique({
      where: { projectId },
      select: { botToken: true },
    });
    
    if (!settings?.botToken) {
      return null;
    }
    
    // Cache the token
    botTokenCache[projectId] = {
      token: settings.botToken,
      expires: Date.now() + BOT_TOKEN_CACHE_TTL
    };
    
    return settings.botToken;
  } catch (error) {
    console.error("Failed to get bot token:", error);
    return null;
  }
}

// Profile photo cache to prevent repeated API calls
type PhotoCacheEntry = { url: string | null, expires: number };
const photoCache: Record<string, PhotoCacheEntry> = {};
const PHOTO_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check the in-memory cache first
    const cacheKey = `${projectId}:${userId}`;
    if (photoCache[cacheKey] && Date.now() < photoCache[cacheKey].expires) {
      return NextResponse.json({ photoUrl: photoCache[cacheKey].url });
    }

    // Check if user exists and get telegramId
    const user = await db.telegramUser.findFirst({
      where: {
        id: userId,
        projectId,
      },
      select: {
        id: true,
        telegramId: true,
        photoUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If user already has a photo URL in the database, return it
    if (user.photoUrl) {
      photoCache[cacheKey] = { url: user.photoUrl, expires: Date.now() + PHOTO_CACHE_TTL };
      return NextResponse.json({ photoUrl: user.photoUrl });
    }

    // Get bot token
    const botToken = await getBotToken(projectId);
    if (!botToken) {
      return NextResponse.json(
        { error: "Telegram bot not configured" },
        { status: 500 }
      );
    }

    // Initialize GrammY bot with minimal config
    const bot = new Bot(botToken);

    // Try to fetch user's profile photos
    try {
      // Convert telegramId to number if it's stored as string in DB
      const telegramIdNum = Number(user.telegramId);
      
      if (isNaN(telegramIdNum)) {
        throw new Error("Invalid telegramId format");
      }
      
      const photos = await bot.api.getUserProfilePhotos(telegramIdNum, { limit: 1 });
      
      // If no photos, cache null result and return
      if (!photos || photos.total_count === 0) {
        photoCache[cacheKey] = { url: null, expires: Date.now() + PHOTO_CACHE_TTL };
        return NextResponse.json({ photoUrl: null });
      }
      
      // Get file info for the first photo (highest quality)
      const photo = photos.photos[0][0];
      const file = await bot.api.getFile(photo.file_id);
      
      if (!file.file_path) {
        throw new Error("No file path in response");
      }
      
      // Construct photo URL
      const photoUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
      
      // Update the user in database with photo URL
      await db.telegramUser.update({
        where: { id: user.id },
        data: { photoUrl },
      });
      
      // Cache the result
      photoCache[cacheKey] = { url: photoUrl, expires: Date.now() + PHOTO_CACHE_TTL };
      
      return NextResponse.json({ photoUrl });
    } catch (error: any) {
      console.error("Failed to fetch user profile photo:", error);
      
      // Cache the error result to prevent repeated failures
      photoCache[cacheKey] = { url: null, expires: Date.now() + (5 * 60 * 1000) }; // 5 min for error cache
      
      return NextResponse.json(
        { error: "Failed to fetch user profile photo", details: error.message },
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