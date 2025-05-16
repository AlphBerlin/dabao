import { Metadata } from "next";
import { notFound } from "next/navigation";
import SettingsPage from "./page.client";

interface ProjectSettingsProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your settings",
};

export default async function ProjectSettings({ params }: ProjectSettingsProps) {
  const { projectId } = await params;

  try {
    // Once we've confirmed authorization, render the page
    return <SettingsPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading settings:", error);
    return notFound();
  }
}