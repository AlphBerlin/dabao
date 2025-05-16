"use client";

import { useParams } from "next/navigation";
import { RouteGuard } from "@/components/route-guard";

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <RouteGuard
      featureFlag="enableCampaigns"
      fallbackPath={`/dashboard/projects/${projectId}`}
    >
      {children}
    </RouteGuard>
  );
}
