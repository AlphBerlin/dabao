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
  
  return <DashboardPage />;
}
