"use client";

import { useOrganizationContext } from "@/contexts/organization-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { Avatar } from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Link from "next/link";
import { useState } from "react";

interface OrganizationSwitcherProps {
  className?: string;
  align?: "start" | "center" | "end";
}

/**
 * Component for switching between organizations
 */
export function OrganizationSwitcher({
  className = "",
  align = "end",
}: OrganizationSwitcherProps) {
  const {
    currentOrganization,
    organizations,
    isLoading,
    setCurrentOrganization,
  } = useOrganizationContext();
  const [isChanging, setIsChanging] = useState(false);

  if (isLoading) {
    return <OrganizationSwitcherSkeleton />;
  }

  // If no current organization or organizations, show placeholder
  if (!currentOrganization || organizations.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/create-organization">Create Organization</Link>
      </Button>
    );
  }

  const handleSwitchOrganization = async (org: any) => {
    if (org.id === currentOrganization?.id) return;
    
    setIsChanging(true);
    try {
      await setCurrentOrganization(org);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 px-3 py-2 ${className}`}
          disabled={isChanging}
        >
          {isChanging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <OrganizationAvatar organization={currentOrganization} size="sm" />
          )}
          <span className="max-w-[150px] truncate font-medium">
            {currentOrganization.name}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56">
        <div className="p-2 text-xs font-medium text-muted-foreground">
          Switch Organization
        </div>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="flex items-center gap-2 p-2"
            onClick={() => handleSwitchOrganization(org)}
          >
            <OrganizationAvatar organization={org} size="sm" />
            <span className="flex-grow truncate">{org.name}</span>
            {org.id === currentOrganization?.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem asChild>
          <Link
            href="/create-organization"
            className="flex items-center gap-2 border-t p-2 mt-1"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span>Create New Organization</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Organization avatar component
 */
function OrganizationAvatar({ organization, size = "md" }: { organization: any, size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-5 w-5 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-lg",
  };
  
  if (!organization) return null;
  
  // Get first letter of organization name
  const initial = organization.name.charAt(0).toUpperCase();
  
  return (
    <Avatar className={sizeClasses[size]}>
      {organization.logo ? (
        <img src={organization.logo} alt={organization.name} />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
          {initial}
        </div>
      )}
    </Avatar>
  );
}

/**
 * Skeleton loader for organization switcher
 */
function OrganizationSwitcherSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}