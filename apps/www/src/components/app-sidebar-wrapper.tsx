"use client";

import { AppSidebar as OriginalAppSidebar } from "@/components/app-sidebar";
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  Sidebar,
} from "@workspace/ui/components/sidebar";
import { Command } from "lucide-react";
import { MultiSidebar } from "./sidebar/multi-sidebar";

export function AppSidebarWrapper(props) {
  return (
    <MultiSidebar
      id="app-sidebar"
      side='right'
      variant="sidebar" 
      collapsible="offcanvas"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
        <Sidebar side="right">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Dabao</span>
                  <span className="truncate text-xs">Dashboard</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Main navigation items could be added here */}
      </SidebarContent>
      <SidebarFooter>
        {/* Footer content */}
      </SidebarFooter>
    </Sidebar>
    </MultiSidebar>
    
  );
}
