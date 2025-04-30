"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationContext } from "@/contexts/organization-context";
import { OrganizationForm } from "@/components/organization/form";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { CreateOrganizationData } from "@/lib/api";

export default function CreateOrganizationPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { isLoading, organizations, error, refreshOrganizations } = useOrganizationContext();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFormSubmit = async (data: CreateOrganizationData) => {
    try {
      // The form component will handle the API call,
      // we just need to refresh the organizations list here
      const refreshToastId = toast.loading('Refreshing organizations...');
      await refreshOrganizations();
      toast.success('Organization list updated', { id: refreshToastId });
      
      // Short delay before redirecting to ensure context is updated
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (error) {
      console.error('Error refreshing organizations:', error);
      toast.error('Failed to refresh organization list');
    }
  };

  if (!isClient) {
    return null;
  }

  const isFirstOrganization = organizations.length === 0;

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        {!isFirstOrganization && (
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </div>
        )}

        <h1 className="text-3xl font-bold mb-8 text-center">
          {isFirstOrganization ? "Welcome to Dabao" : "Create a New Organization"}
        </h1>
        
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
              {isFirstOrganization 
                ? "To get started, please create your first organization." 
                : "Create a new organization to manage different teams or projects."}
            </p>
            <OrganizationForm onSubmit={handleFormSubmit} />
          </>
        )}
      </div>
    </div>
  );
}