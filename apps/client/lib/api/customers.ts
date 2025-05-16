// lib/api/customers.ts
import { useProjectContext } from "@/hooks/useProjectContext";

interface CreateCustomerData {
  projectId: string;
  email: string;
  name?: string;
  phone?: string;
  supabaseUserId?: string;
}

export async function createCustomer(data: CreateCustomerData) {
  // Get base URL - remove any route path and use domain only
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  
  const response = await fetch(`${baseUrl}/api/projects/${data.projectId}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      name: data.name || data.email.split("@")[0],
      phone: data.phone,
      supabaseUserId: data.supabaseUserId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create customer");
  }

  return await response.json();
}

export async function fetchCustomerByEmail(email: string, projectId?: string) {
  let resolvedProjectId = projectId;
  
  if (!resolvedProjectId) {
    // Try to get from context if not provided
    const { project } = useProjectContext();
    resolvedProjectId = project?.id;
  }
  
  if (!resolvedProjectId) {
    throw new Error("Project ID not available");
  }
  
  // Get base URL - remove any route path and use domain only
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  
  const response = await fetch(`${baseUrl}/api/projects/${resolvedProjectId}/customers?search=${encodeURIComponent(email)}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch customer");
  }

  const data = await response.json();
  // Return the first customer that matches the email exactly
  return data.data.find((customer: any) => 
    customer.email.toLowerCase() === email.toLowerCase()
  );
}

export async function linkSupabaseUserToCustomer(customerId: string, supabaseUserId: string, projectId?: string) {
  let resolvedProjectId = projectId;
  
  if (!resolvedProjectId) {
    // Try to get from context if not provided
    const { project } = useProjectContext();
    resolvedProjectId = project?.id;
  }
  
  if (!resolvedProjectId) {
    throw new Error("Project ID not available");
  }
  
  // Get base URL - remove any route path and use domain only
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
  
  const response = await fetch(`${baseUrl}/api/projects/${resolvedProjectId}/customers/${customerId}/link-user`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      supabaseUserId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to link user to customer");
  }

  return await response.json();
}
