import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import  CampaignsPage  from "./page.client";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface CampaignsProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Manage your marketing campaigns",
};

export default async function Campaigns({ params }: CampaignsProps) {
  const { projectId } = params;

  // Server-side authorization check - users need READ permission for campaigns
  await requirePermission(
    projectId,
    RESOURCE_TYPES.CAMPAIGN,
    ACTION_TYPES.READ,
    `/dashboard/projects/${projectId}`  // Redirect to project page if unauthorized
  );

  try {
    // Once we've confirmed authorization, render the page
    return <CampaignsPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading campaigns:", error);
    return notFound();
  }
}