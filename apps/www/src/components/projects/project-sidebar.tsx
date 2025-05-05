"use client";

import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import {
  ChevronLeft,
  Home,
  Users,
  Award,
  Gift,
  Megaphone,
  BarChart3,
  Settings,
  Puzzle,
  Smartphone,
  Layers,
  Bell,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface Project {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface ProjectSidebarProps {
  project: Project | null;
  pathname: string;
  loading: boolean;
}

export function ProjectSidebar({ project, pathname, loading }: ProjectSidebarProps) {
  if (loading) {
    return (
      <div className="min-h-screen w-64 border-r p-6 flex flex-col">
        <div className="flex items-center mb-6">
          <Skeleton className="h-9 w-9 rounded-md mr-3" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-64 border-r p-6 flex flex-col">
      <Link
        href="/dashboard/projects"
        className="flex items-center text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        <span>Back to Projects</span>
      </Link>

      {project ? (
        <div className="flex items-center mb-6">
          {project.logoUrl ? (
            <div className="h-9 w-9 rounded-md overflow-hidden mr-3">
              <img
                src={project.logoUrl}
                alt={project.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center mr-3">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h2 className="font-semibold truncate">{project.name}</h2>
        </div>
      ) : (
        <div className="h-9 mb-6"></div>
      )}

      <nav className="space-y-6 flex-1">
        <div className="space-y-1">
          <NavLink
            href={`/dashboard/projects/${project?.id}`}
            icon={<Home className="h-4 w-4 mr-3" />}
            isActive={pathname === `/dashboard/projects/${project?.id}`}
          >
            Overview
          </NavLink>
          <NavLink
            href={`/dashboard/projects/${project?.id}/customers`}
            icon={<Users className="h-4 w-4 mr-3" />}
            isActive={pathname.includes(`/dashboard/projects/${project?.id}/customers`)}
          >
            Customers
          </NavLink>
          <NavLink
            href={`/dashboard/projects/${project?.id}/rewards`}
            icon={<Gift className="h-4 w-4 mr-3" />}
            isActive={pathname.includes(`/dashboard/projects/${project?.id}/rewards`)}
          >
            Rewards
          </NavLink>
          <NavLink
            href={`/dashboard/projects/${project?.id}/campaigns`}
            icon={<Megaphone className="h-4 w-4 mr-3" />}
            isActive={pathname.includes(`/dashboard/projects/${project?.id}/campaigns`)}
          >
            Campaigns
          </NavLink>
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3">ADVANCED</h3>
          <div className="space-y-1">
        
            <NavLink
              href={`/dashboard/projects/${project?.id}/integrations`}
              icon={<Puzzle className="h-4 w-4 mr-3" />}
              isActive={pathname.includes(`/dashboard/projects/${project?.id}/integrations`)}
            >
              Integrations
            </NavLink>
            <NavLink
              href={`/dashboard/projects/${project?.id}/notifications`}
              icon={<Bell className="h-4 w-4 mr-3" />}
              isActive={pathname.includes(`/dashboard/projects/${project?.id}/notifications`)}
            >
              Notifications
            </NavLink>
          </div>
        </div>
      </nav>

      <div className="mt-6 pt-6 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          size="sm"
          asChild
        >
          <Link href={`/dashboard/projects/${project?.id}/settings`}>
            <Settings className="h-4 w-4 mr-2" />
            Project Settings
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function NavLink({ href, icon, children, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center h-10 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {icon}
      {children}
    </Link>
  );
}