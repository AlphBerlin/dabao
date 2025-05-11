import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";
import ProjectSettingsPage from "./page.client";

interface ProjectSettingsProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Project Settings",
  description: "Manage your project settings",
};

export default async function ProjectSettings({ params }: ProjectSettingsProps) {
  const { projectId } = params;

  // Server-side authorization check - users need MANAGE permission for the project
  await requirePermission(
    projectId,
    RESOURCE_TYPES.PROJECT,
    ACTION_TYPES.MANAGE,
    `/dashboard/projects/${projectId}`  // Redirect to project page if unauthorized
  );

  try {
    // Once we've confirmed authorization, render the page
    return <ProjectSettingsPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading project settings:", error);
    return notFound();
  }
}