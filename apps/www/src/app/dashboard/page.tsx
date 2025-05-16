import { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server-auth";
import DashboardPage from "./page.client";
import { db } from "@/lib/db";

// export const metadata: Metadata = {
//   title: "Dashboard",
//   description: "View your organizations and projects",
// };

export default async function Dashboard() {
  // Get authenticated user session
  const session = await requireAuth("/auth/login");
  
  // Check if user has any organizations
  const user = await db.user.findUnique({
    where: { supabaseUserId: session.user.id },
    include: {
      organizations: {
        take: 1,
      }
    }
  });
  
  // If no organizations found, redirect to create organization page
  if (!user?.organizations || user.organizations.length === 0) {
    redirect("/create-organization");
  }
  
  // Check if the organization has any projects
  const organizationId = user.organizations[0].organizationId;
  const projects = await db.project.findMany({
    where: { organizationId },
    take: 1,
  });
  
  // If no projects found, redirect to create project page
  if (!projects || projects.length === 0) {
    redirect("/dashboard/projects/new");
  }
  
  return <DashboardPage />;
}
