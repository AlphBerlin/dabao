"use client";

import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ProjectSidebarWrapper } from "@/components/projects/project-sidebar";
import { ProjectHeader } from "@/components/projects/project-header";
import { Toaster } from "@workspace/ui/components/sonner";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { AppSidebarWrapper } from "@/components/app-sidebar-wrapper";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { DualSidebarProvider } from "@/components/sidebar/dual-sidebar-provider";

interface Project {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);

        if (!response.ok) {
          throw new Error("Failed to load project");
        }

        const data = await response.json();
        setProject(data.project);
      } catch (error) {
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return (
    <div className="max-h-screen">
      {/* Use SidebarProvider from the library to satisfy useSidebar() calls */}
      <SidebarProvider>
        {/* Our custom dual sidebar context for independent sidebar toggling */}
        <DualSidebarProvider>
          {/* Main Content containing Project Header and children */}
          <div className="flex h-screen relative">
            {/* Left Project Sidebar - New wrapped component using MultiSidebar */}
            <ProjectSidebarWrapper
              project={project}
              pathname={pathname}
              loading={loading}
            />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ProjectHeader project={project} loading={loading} />
              <main className="flex-1 overflow-y-auto mx-6">
                <ScrollArea className="h-screen">{children}</ScrollArea>
              </main>
              <Toaster />
            </div>
            
            {/* Right App Sidebar with content */}
            <AppSidebarWrapper />
          </div>
        </DualSidebarProvider>
      </SidebarProvider>
    </div>
  );
}
