import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; campaignId: string } }
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

    const campaign = await prisma.campaign.findUnique({
      where: {
        id: params.campaignId,
        projectId: params.projectId,
      },
      include: {
        telegramCampaign: true,
        rewards: {
          include: {
            reward: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; campaignId: string } }
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

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: {
        id: params.campaignId,
        projectId: params.projectId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const data = await req.json();
    
    // Process dates if they come as strings
    const processedData: any = { ...data };
    if (typeof data.startDate === 'string') {
      processedData.startDate = new Date(data.startDate);
    }
    
    if (typeof data.endDate === 'string') {
      processedData.endDate = new Date(data.endDate);
    }

    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: params.campaignId,
      },
      data: processedData,
      include: {
        telegramCampaign: true,
        rewards: {
          include: {
            reward: true,
          },
        },
      },
    });

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { projectId: string; campaignId: string } }
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

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: {
        id: params.campaignId,
        projectId: params.projectId,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Delete the campaign
    await prisma.campaign.delete({
      where: {
        id: params.campaignId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}