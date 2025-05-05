import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

// Schema for creating/updating Telegram settings
const telegramSettingsSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  botUsername: z.string().min(1, "Bot username is required"),
  webhookUrl: z.string().url().optional().nullable(),
  welcomeMessage: z.string().optional().nullable(),
  helpMessage: z.string().optional().nullable(),
  enableCommands: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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

    const telegramSettings = await prisma.telegramSettings.findUnique({
      where: {
        projectId: params.projectId,
      },
    });

    // If settings don't exist, return an empty object
    if (!telegramSettings) {
      return NextResponse.json({});
    }

    return NextResponse.json(telegramSettings);
  } catch (error) {
    console.error("Error fetching Telegram settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram settings" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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

    const data = await req.json();
    const validatedData = telegramSettingsSchema.parse(data);

    // Check if settings already exist
    const existingSettings = await prisma.telegramSettings.findUnique({
      where: {
        projectId: params.projectId,
      },
    });

    let telegramSettings;

    if (existingSettings) {
      // Update existing settings
      telegramSettings = await prisma.telegramSettings.update({
        where: {
          projectId: params.projectId,
        },
        data: validatedData,
      });
    } else {
      // Create new settings
      telegramSettings = await prisma.telegramSettings.create({
        data: {
          projectId: params.projectId,
          ...validatedData,
          status: "ACTIVE",
        },
      });
    }

    return NextResponse.json(telegramSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error saving Telegram settings:", error);
    return NextResponse.json(
      { error: "Failed to save Telegram settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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

    // Check if settings exist
    const existingSettings = await prisma.telegramSettings.findUnique({
      where: {
        projectId: params.projectId,
      },
    });

    if (!existingSettings) {
      return NextResponse.json(
        { error: "Telegram settings not found" },
        { status: 404 }
      );
    }

    const data = await req.json();
    // Partial validation for PATCH
    const validatedData = telegramSettingsSchema.partial().parse(data);

    // Update the settings
    const telegramSettings = await prisma.telegramSettings.update({
      where: {
        projectId: params.projectId,
      },
      data: validatedData,
    });

    return NextResponse.json(telegramSettings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating Telegram settings:", error);
    return NextResponse.json(
      { error: "Failed to update Telegram settings" },
      { status: 500 }
    );
  }
}