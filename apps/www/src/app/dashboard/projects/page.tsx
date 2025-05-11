import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import ProjectPage from "./page.client";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface ProjectProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Project Dashboard",
  description: "View and manage your project",
};

export default async function Project({ params }: ProjectProps) {
  const { projectId } = params;

  // Server-side authorization check - users need READ permission for the project
  await requirePermission(
    projectId,
    RESOURCE_TYPES.PROJECT,
    ACTION_TYPES.READ,
    "/dashboard"
  );

  try {
    // Once we've confirmed authorization, render the page
    return <ProjectPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading project:", error);
    return notFound();
  }
}
