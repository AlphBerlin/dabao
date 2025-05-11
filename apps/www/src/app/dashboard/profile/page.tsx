import { Metadata } from "next";
import { requireAuth } from "@/lib/auth/server-auth";
import  ProfilePage  from "./page.client";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your user profile",
};

export default async function Profile() {
  // Server-side authentication check - only requires the user to be logged in
  const session = await requireAuth("/login");

  return <ProfilePage />;
}