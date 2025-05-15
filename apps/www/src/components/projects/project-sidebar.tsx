"use client";

import Link from "next/link";
import {
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  Sidebar,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import {
  Home,
  Users,
  Gift,
  Megaphone,
  Settings,
  Puzzle,
  Bell,
} from "lucide-react";
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
  sidebarId?: string;
}

export default function ProjectSidebar({ project, pathname, loading }: ProjectSidebarProps) {
  if (loading) {
    return (
      <Sidebar collapsible="icon" variant='inset' className="sticky hidden lg:flex top-0 h-svh border-l">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <Skeleton className="h-10 w-full" />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </SidebarGroup>
          
          <SidebarGroup>
            <Skeleton className="h-4 w-16 mb-3" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Skeleton className="h-9 w-full" />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="none" variant='inset' className="sticky hidden lg:flex top-0 h-svh border-l">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard/projects">
                {project?.logoUrl ? (
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                    <img
                      src={project.logoUrl}
                      alt={project.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-primary/10 text-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                    {project?.name ? project.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                )}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{project?.name || 'Project'}</span>
                  <span className="truncate text-xs text-muted-foreground">Back to projects</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={pathname === `/dashboard/projects/${project?.id}`}
                asChild
              >
                <Link href={`/dashboard/projects/${project?.id}`}>
                  <Home className="size-4" />
                  <span>Overview</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={pathname.includes(`/dashboard/projects/${project?.id}/customers`)}
                asChild
              >
                <Link href={`/dashboard/projects/${project?.id}/customers`}>
                  <Users className="size-4" />
                  <span>Customers</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={pathname.includes(`/dashboard/projects/${project?.id}/rewards`)}
                asChild
              >
                <Link href={`/dashboard/projects/${project?.id}/rewards`}>
                  <Gift className="size-4" />
                  <span>Rewards</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={pathname.includes(`/dashboard/projects/${project?.id}/campaigns`)}
                asChild
              >
                <Link href={`/dashboard/projects/${project?.id}/campaigns`}>
                  <Megaphone className="size-4" />
                  <span>Campaigns</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Advanced</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={pathname.includes(`/dashboard/projects/${project?.id}/notifications`)}
                asChild
              >
                <Link href={`/dashboard/projects/${project?.id}/notifications`}>
                  <Bell className="size-4" />
                  <span>Notifications</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={pathname.includes(`/dashboard/projects/${project?.id}/integrations`)}
                asChild
              >
                <Link href={`/dashboard/projects/${project?.id}/integrations`}>
                  <Puzzle className="size-4" />
                  <span>Integrations</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={pathname.includes(`/dashboard/projects/${project?.id}/settings`)}
              asChild
            >
              <Link href={`/dashboard/projects/${project?.id}/settings`}>
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
            <SidebarRail />
      
    </Sidebar>
  );
}
