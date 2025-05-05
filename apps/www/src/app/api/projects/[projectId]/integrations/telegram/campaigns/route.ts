import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

// Schema for creating/updating a Telegram campaign
const telegramCampaignSchema = z.object({
  campaignId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  messageTemplate: z.string(),
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
});

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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

    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    let query: any = {
      where: {
        projectId: projectId,
      },
      include: {
        campaign: true,
      },
    };

    // Filter by campaign ID if provided
    if (campaignId) {
      query.where.campaignId = campaignId;
    }

    const telegramCampaigns = await prisma.telegramCampaign.findMany(query);

    return NextResponse.json(telegramCampaigns);
  } catch (error) {
    console.error("Error fetching Telegram campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch Telegram campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
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

    const data = await req.json();
    const validatedData = telegramCampaignSchema.parse(data);

    // Check if the campaign exists and belongs to this project
    if (validatedData.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: validatedData.campaignId,
          projectId: projectId,
        },
      });

      if (!campaign) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
    }

    // Get campaign name if not provided
    let name = validatedData.name;
    if (!name && validatedData.campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: validatedData.campaignId },
        select: { name: true }
      });
      name = campaign?.name || "Telegram Campaign";
    }

    // Create the Telegram campaign
    const telegramCampaign = await prisma.telegramCampaign.create({
      data: {
        projectId: projectId,
        campaignId: validatedData.campaignId,
        name: name,
        description: validatedData.description,
        messageTemplate: validatedData.messageTemplate,
        imageUrl: validatedData.imageUrl,
        buttons: validatedData.buttons || [],
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        audienceFilter: validatedData.audienceFilter || {},
        status: validatedData.scheduledFor ? "SCHEDULED" : "DRAFT",
      },
    });

    return NextResponse.json(telegramCampaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating Telegram campaign:", error);
    return NextResponse.json(
      { error: "Failed to create Telegram campaign" },
      { status: 500 }
    );
  }
}
