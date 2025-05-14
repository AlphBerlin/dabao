"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { useMultiSidebar } from "./dual-sidebar-provider";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";

interface MultiSidebarProps {
  id: string;
  side: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
  className?: string;
  children: React.ReactNode;
}

export function MultiSidebar({
  id,
  side = "left",
  variant = "sidebar",
  collapsible = "icon",
  className,
  children,
  ...props
}: MultiSidebarProps) {
  const { sidebarStates, isMobile, toggleSidebar } = useMultiSidebar();
  const isOpen = sidebarStates[id] || false;
  const state = isOpen ? "expanded" : "collapsed";
  
  // Handle mobile view with sheets
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={() => toggleSidebar(id)}>
        <SheetContent
          data-sidebar={id}
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={{
            "--sidebar-width": SIDEBAR_WIDTH_MOBILE
          } as React.CSSProperties}
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view
  return (
    <div
      className={cn(
        "group peer text-sidebar-foreground",
        collapsible === "none" ? "block" : !isOpen ? "hidden" : "block"
      )}
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-sidebar={id}
      {...props}
    >
      {/* This handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative bg-transparent transition-[width] duration-200 ease-linear",
          isOpen ? "w-(--sidebar-width)" : 
            collapsible === "icon" ? "w-(--sidebar-width-icon)" : "w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : ""
        )}
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        } as React.CSSProperties}
      />
      
      {/* The actual sidebar container */}
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
          isOpen 
            ? "w-(--sidebar-width)" 
            : collapsible === "icon" 
              ? "w-(--sidebar-width-icon)" 
              : "w-0",
          side === "left"
            ? "left-0"
            : "right-0",
          className
        )}
        style={{
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
        } as React.CSSProperties}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar flex h-full w-full flex-col rounded-lg"
        >
          {children}
        </div>
      </div>
      
      {/* Rail for resizing if needed */}
      {collapsible !== "none" && (
        <button
          data-sidebar="rail"
          data-slot="sidebar-rail"
          aria-label="Toggle Sidebar"
          tabIndex={-1}
          onClick={() => toggleSidebar(id)}
          title="Toggle Sidebar"
          className={cn(
            "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
            "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
            side === "left" ? "-right-2" : "-left-2"
          )}
        />
      )}
    </div>
  );
}
