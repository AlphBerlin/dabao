import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/server-auth";
import { AdminDashboard } from "@/components/admin/dashboard";
import { getProject } from "@/lib/api/project";
import { RESOURCE_TYPES, ACTION_TYPES } from "@/lib/casbin/enforcer";

interface AdminPageProps {
  params: {
    projectId: string;
  };
}

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin dashboard for managing project settings and users",
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { projectId } = params;

  // Server-side authorization check
  await requirePermission(
    projectId,
    RESOURCE_TYPES.PROJECT,
    ACTION_TYPES.ADMIN,
    "/projects/" + projectId // Redirect to project home if unauthorized
  );

  try {
    // Fetch project details
    const project = await getProject(projectId);
    
    if (!project) {
      return notFound();
    }

    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <AdminDashboard project={project} />
      </div>
    );
  } catch (error) {
    console.error("Error loading admin page:", error);
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading admin dashboard. Please try again later.
        </div>
      </div>
    );
  }
}