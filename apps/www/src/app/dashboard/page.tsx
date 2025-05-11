import { Metadata } from "next";
import { requireAuth } from "@/lib/auth/server-auth";
import DashboardPage from "./page.client";

// export const metadata: Metadata = {
//   title: "Dashboard",
//   description: "View your organizations and projects",
// };

export default async function Dashboard() {
  const session = await requireAuth("/login");

  return <DashboardPage />;
}
