import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/auth";
import { hasProjectAccess } from "@/lib/auth/project-access";

// Status update schema
const statusSchema = z.object({
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED']),
});

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
      include: {
        telegramCampaign: true,
      },
    });

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const data = await req.json();
    const { status } = statusSchema.parse(data);

    // Update campaign status
    const updatedCampaign = await prisma.campaign.update({
      where: {
        id: params.campaignId,
      },
      data: { status },
      include: {
        telegramCampaign: true,
      },
    });

    // If campaign is activated and has Telegram integration, update Telegram campaign status too
    if (status === 'ACTIVE' && updatedCampaign.telegramCampaign) {
      await prisma.telegramCampaign.update({
        where: {
          id: updatedCampaign.telegramCampaign.id,
        },
        data: {
          status: updatedCampaign.telegramCampaign.scheduledFor ? 'SCHEDULED' : 'ACTIVE',
        },
      });

      // If Telegram campaign is scheduled but the scheduled time is in the past,
      // we should trigger the campaign send process
      if (updatedCampaign.telegramCampaign.scheduledFor) {
        const scheduledTime = new Date(updatedCampaign.telegramCampaign.scheduledFor);
        if (scheduledTime <= new Date()) {
          // The campaign should be sent immediately
          // This would typically be handled by a background job/queue
          // For now, we'll just update the status
          await prisma.telegramCampaign.update({
            where: {
              id: updatedCampaign.telegramCampaign.id,
            },
            data: {
              status: 'SENDING',
            },
          });

          // In a real implementation, you would trigger a background job here
          // triggerCampaignSend(updatedCampaign.telegramCampaign.id);
        }
      }
    }

    // If campaign is paused and has Telegram integration, update Telegram campaign status
    if (status === 'PAUSED' && updatedCampaign.telegramCampaign) {
      await prisma.telegramCampaign.update({
        where: {
          id: updatedCampaign.telegramCampaign.id,
        },
        data: {
          status: 'PAUSED',
        },
      });
    }

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return NextResponse.json(
      { error: "Failed to update campaign status" },
      { status: 500 }
    );
  }
}