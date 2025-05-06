"use client";

import { useParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ProjectSidebar } from "@/components/projects/project-sidebar";
import { ProjectHeader } from "@/components/projects/project-header";
import { Toaster } from "@workspace/ui/components/sonner"
import { ScrollArea } from "@workspace/ui/components/scroll-area";

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
    <div className="flex min-h-screen">
      <ProjectSidebar project={project} pathname={pathname} loading={loading} />
      <div className="flex-1 flex flex-col">
        <ProjectHeader project={project} loading={loading} />
        <main className="flex-1 overflow-y-auto mx-6">
          <ScrollArea className="h-screen">
          {children}
          </ScrollArea>
        </main>
      </div>
      <Toaster />
    </div>
  );
}