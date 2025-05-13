import { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const { projectId } = await params;

  try {
    // Once we've confirmed authorization, render the page
    return <ProjectSettingsPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading project settings:", error);
    return notFound();
  }
}