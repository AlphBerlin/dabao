import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import  CustomersPage from "./page.client";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface CustomersProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Customers",
  description: "Manage your customers",
};

export default async function Customers({ params }: CustomersProps) {
  const { projectId } = params;

  // Server-side authorization check - users need READ permission for customers
  await requirePermission(
    projectId,
    RESOURCE_TYPES.CUSTOMER,
    ACTION_TYPES.READ,
    `/projects/${projectId}`  // Redirect to project page if unauthorized
  );

  try {
    // Once we've confirmed authorization, render the page
    return <CustomersPage projectId={projectId} />;
  } catch (error) {
    console.error("Error loading customers:", error);
    return notFound();
  }
}