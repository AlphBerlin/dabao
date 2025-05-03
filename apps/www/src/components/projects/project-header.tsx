"use client";

import { useState } from "react";
import { 
  Bell, 
  Search, 
  Settings,
  HelpCircle,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

interface Project {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface ProjectHeaderProps {
  project: Project | null;
  loading: boolean;
}

export function ProjectHeader({ project, loading }: ProjectHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  if (loading) {
    return (
      <header className="h-16 border-b px-6 flex items-center justify-between">
        <div className="w-full max-w-md">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-28" />
        </div>
      </header>
    );
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement project-wide search functionality
    console.log(`Searching for: ${searchQuery}`);
  };

  return (
    <header className="h-16 border-b px-6 flex items-center justify-between">
      <form onSubmit={handleSearch} className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Search in ${project?.name || 'project'}...`}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <span className="font-medium">Account</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" sideOffset={5}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a 
            href="/dashboard/profile" 
            className="cursor-pointer w-full flex items-center no-underline"
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a 
            href="/dashboard/settings" 
            className="cursor-pointer w-full flex items-center no-underline"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild variant="destructive">
          <a 
            href="/api/auth/signout" 
            className="cursor-pointer w-full flex items-center text-red-500 hover:text-red-600 no-underline"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
      </div>
    </header>
  );
}