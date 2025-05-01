"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@workspace/ui/lib/utils";
import {
  Home,
  Users,
  Award,
  Settings,
  Megaphone,
  BarChart,
  Zap,
  Code,
  Sparkles,
  FileText,
  Star,
} from "lucide-react";

interface ProjectSidebarProps {
  project: {
    id: string;
    name: string;
    slug: string;
    preferences?: {
      pointsName?: string;
      enableGameification?: boolean;
    } | null;
  };
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  const pathname = usePathname();
  const projectId = project.id;
  
  const routes = [
    {
      title: "Overview",
      href: `/dashboard/projects/${projectId}`,
      icon: Home,
    },
    {
      title: "Customers",
      href: `/dashboard/projects/${projectId}/customers`,
      icon: Users,
    },
    {
      title: "Rewards",
      href: `/dashboard/projects/${projectId}/rewards`,
      icon: Award,
    },
    {
      title: `${project.preferences?.pointsName || "Points"}`,
      href: `/dashboard/projects/${projectId}/points`,
      icon: Star,
    },
    {
      title: "Campaigns",
      href: `/dashboard/projects/${projectId}/campaigns`,
      icon: Megaphone,
    },
    {
      title: "Analytics",
      href: `/dashboard/projects/${projectId}/analytics`,
      icon: BarChart,
    },
    {
      title: "Integration",
      href: `/dashboard/projects/${projectId}/integration`,
      icon: Code,
    },
  ];

  if (project.preferences?.enableGameification) {
    routes.splice(4, 0, {
      title: "Gamification",
      href: `/dashboard/projects/${projectId}/gamification`,
      icon: Sparkles,
    });
  }

  const bottomRoutes = [
    {
      title: "Documentation",
      href: `/dashboard/projects/${projectId}/docs`,
      icon: FileText,
    },
    {
      title: "Settings",
      href: `/dashboard/projects/${projectId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-col h-full w-64 border-r bg-background">
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-lg font-semibold truncate">{project.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="flex flex-col gap-1 px-2">
          {routes.map((route) => (
            <Link 
              key={route.href} 
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === route.href || (pathname.startsWith(route.href) && route.href !== `/dashboard/projects/${projectId}`)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t py-4">
        <nav className="flex flex-col gap-1 px-2">
          {bottomRoutes.map((route) => (
            <Link 
              key={route.href} 
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === route.href || (pathname.startsWith(route.href) && route.href !== `/dashboard/projects/${projectId}`)
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 hover:text-accent-foreground"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}