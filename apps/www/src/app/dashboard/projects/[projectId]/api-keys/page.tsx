import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import { ApiKeysPage } from "@/components/api-keys-page";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface ApiKeysProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "API Keys",
  description: "Manage your API keys and tokens",
};

export default async function ApiKeys({ params }: ApiKeysProps) {
  const { projectId } = params;

  // Server-side authorization check - users need ADMIN permission for API keys
  await requirePermission(
    projectId,
    RESOURCE_TYPES.API_KEY,
    ACTION_TYPES.ALL,
    `/dashboard/projects/${projectId}`  // Redirect to project page if unauthorized
  );

  try {
    // Once we've confirmed authorization, render the page
    return <ApiKeysPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading API keys page:", error);
    return notFound();
  }
}