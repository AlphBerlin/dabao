"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  ExternalLink,
  ChevronDown,
  CircleUser,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    customDomain: string | null;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  };
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

export function ProjectHeader({ project, user }: ProjectHeaderProps) {
  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 lg:gap-4">
          <form className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-72 bg-background pl-8"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Badge
              variant={project.active ? "success" : "destructive"}
              className={cn(
                "rounded-md px-2 py-0.5",
                project.active ? "bg-green-500" : "bg-red-500"
              )}
            >
              {project.active ? "Active" : "Inactive"}
            </Badge>
            {project.customDomain && (
              <Button variant="outline" size="sm" className="hidden lg:flex">
                <Link
                  href={`https://${project.customDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <span className="text-xs">{project.customDomain}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || "User"}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <CircleUser className="h-5 w-5" />
                )}
                <span className="hidden lg:inline-block">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/api/auth/signout">Logout</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}