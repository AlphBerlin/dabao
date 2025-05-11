import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import IntegrationsPage  from "./page.client";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface IntegrationsProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Integrations",
  description: "Manage third-party integrations and connections",
};

export default async function Integrations({ params }: IntegrationsProps) {
  const { projectId } = await params;

  // Server-side authorization check - users need MANAGE permission for integrations
  await requirePermission(
    projectId,
    RESOURCE_TYPES.INTEGRATION,
    ACTION_TYPES.MANAGE,
    `/dashboard/projects/${projectId}`  // Redirect to project page if unauthorized
  );

  try {
    // Once we've confirmed authorization, render the page
    return <IntegrationsPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading integrations page:", error);
    return notFound();
  }
}