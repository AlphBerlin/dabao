import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import { CustomerDetailPage } from "@/components/customer-detail-page";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface CustomerDetailProps {
  params: {
    projectId: string;
    customerId: string;
  };
}

export const metadata: Metadata = {
  title: "Customer Details",
  description: "View and manage customer information",
};

export default async function CustomerDetail({ params }: CustomerDetailProps) {
  const { projectId, customerId } = params;

  // Server-side authorization check - users need READ permission for customer data
  await requirePermission(
    projectId,
    RESOURCE_TYPES.CUSTOMER,
    ACTION_TYPES.READ,
    `/projects/${projectId}/customers`  // Redirect to customers page if unauthorized
  );

  try {
    // Once we've confirmed authorization, render the page
    return <CustomerDetailPage projectId={projectId} customerId={customerId} />;
  } catch (error) {
    console.error("Error loading customer detail page:", error);
    return notFound();
  }
}