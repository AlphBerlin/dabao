"use client";

import { useEffect, useState } from "react";
import { useOrganization } from "@/lib/hooks";
import { OrganizationForm } from "@/components/organization/form";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";

export default function CreateOrganizationPage() {
  const [isClient, setIsClient] = useState(false);
  const { isLoading, hasOrganizations, error } = useOrganization({
    redirectIfFound: true,
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Welcome to Dabao</h1>
        
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-8 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-12 w-full mt-4" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-28 ml-auto mt-4" />
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-medium mb-2 text-destructive">Oops, something went wrong</h2>
              <p className="text-muted-foreground">{error}</p>
              <p className="mt-4">
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <p className="text-center text-muted-foreground mb-8">
              To get started, please create your first organization.
            </p>
            <OrganizationForm />
          </>
        )}
      </div>
    </div>
  );
}