import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

// Schema for creating/updating campaigns
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional().nullable(),
  type: z.string(),
  status: z.string().optional(),
  pointsMultiplier: z.number().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

// GET handler for listing campaigns
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
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status");

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {
      projectId: projectId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.campaign.count({
      where,
    });

    // Get campaigns with pagination
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        telegramCampaign: true,
        _count: {
          select: {
            rewards: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Format campaigns to include customer counts (for display purposes)
    const formattedCampaigns = campaigns.map((campaign) => ({
      ...campaign,
      _count: {
        customers: 0, // Placeholder - would be populated from actual customer tracking logic
        rewards: campaign._count.rewards,
        activities: 0, // Placeholder - would be populated from actual activities tracking
      },
      integrations: campaign.telegramCampaign
        ? [
            {
              type: "TELEGRAM",
              status: campaign.telegramCampaign.status === "DRAFT" ? "PENDING" : "CONNECTED",
              id: campaign.telegramCampaign.id,
              name: campaign.telegramCampaign.name,
            },
          ]
        : [],
    }));

    return NextResponse.json({
      campaigns: formattedCampaigns,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new campaign
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
    const validatedData = campaignSchema.parse(data);

    // Create the campaign
    const campaign = await prisma.campaign.create({
      data: {
        projectId: projectId,
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        status: validatedData.status || "DRAFT",
        pointsMultiplier: validatedData.pointsMultiplier,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}