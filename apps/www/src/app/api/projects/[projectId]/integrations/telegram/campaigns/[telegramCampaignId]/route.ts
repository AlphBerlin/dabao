import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

// Schema for updating a Telegram campaign
const updateTelegramCampaignSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  messageTemplate: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  buttons: z.array(
    z.object({
      text: z.string(),
      url: z.string().url().optional(),
      callbackData: z.string().optional(),
    })
  ).optional(),
  scheduledFor: z.string().datetime().optional().nullable(),
  audienceFilter: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'CANCELLED', 'FAILED']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; telegramCampaignId: string } }
) {
  try {
    const projectId = (await params).projectId;

    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const telegramCampaign = await prisma.telegramCampaign.findUnique({
      where: {
        id: params.telegramCampaignId,
        projectId: projectId,
      },
      include: {
        campaign: true,
      },
    });

    if (!telegramCampaign) {
      return NextResponse.json(
        { error: "Telegram campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(telegramCampaign);
  } catch (error) {
    console.error("Error fetching Telegram campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; telegramCampaignId: string } }
) {
  try {
    const projectId = (await params).projectId;
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the telegram campaign exists and belongs to this project
    const existingCampaign = await prisma.telegramCampaign.findFirst({
      where: {
        id: params.telegramCampaignId,
        projectId: projectId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Telegram campaign not found" },
        { status: 404 }
      );
    }

    const data = await req.json();
    const validatedData = updateTelegramCampaignSchema.parse(data);

    // Update status based on scheduledFor if status is not explicitly provided
    let status = validatedData.status;
    if (!status && validatedData.scheduledFor !== undefined) {
      status = validatedData.scheduledFor ? "SCHEDULED" : "DRAFT";
    }

    const updatedCampaign = await prisma.telegramCampaign.update({
      where: {
        id: params.telegramCampaignId,
      },
      data: {
        ...validatedData,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        status: status || undefined,
      },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error updating Telegram campaign:", error);
    return NextResponse.json(
      { error: "Failed to update Telegram campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; telegramCampaignId: string } }
) {
  try {
    const projectId = (await params).projectId;
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await hasProjectAccess(user.id, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if the telegram campaign exists and belongs to this project
    const existingCampaign = await prisma.telegramCampaign.findFirst({
      where: {
        id: params.telegramCampaignId,
        projectId: projectId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Telegram campaign not found" },
        { status: 404 }
      );
    }

    // Delete the telegram campaign
    await prisma.telegramCampaign.delete({
      where: {
        id: params.telegramCampaignId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting Telegram campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete Telegram campaign" },
      { status: 500 }
    );
  }
}