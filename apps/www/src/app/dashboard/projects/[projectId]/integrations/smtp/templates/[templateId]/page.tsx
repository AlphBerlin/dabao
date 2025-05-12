"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@workspace/ui/components/breadcrumb";
import { TemplateEditor } from "../components/template-editor";
import  TemplateSettings  from "./components/template-settings";
import TemplateVersions  from "./components/template-versions";
import { fetchTemplate } from "@/lib/api/email-templates";
import { Skeleton } from "@workspace/ui/components/skeleton";

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Create a wrapped component that uses React Query hooks
function TemplateEditorPageContent() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const templateId = params.templateId as string;
  const [activeTab, setActiveTab] = useState("editor");

  const {
    data: template,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["emailTemplate", projectId, templateId],
    queryFn: () => fetchTemplate(projectId, templateId),
  });

  // Handle back navigation
  const handleBack = () => {
    router.push(`/dashboard/projects/${projectId}/integrations/smtp`);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <h3 className="text-lg font-medium mb-3">Template not found</h3>
        <p className="text-muted-foreground mb-5">
          The template you requested does not exist or you do not have access to it.
        </p>
        <Button onClick={handleBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumb className="overflow-hidden">
          <BreadcrumbItem>
            <BreadcrumbLink onClick={handleBack}>Email Templates</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="font-medium truncate">{template?.name}</span>
            )}
          </BreadcrumbItem>
        </Breadcrumb>
        
        <Button 
          variant="outline" 
          onClick={handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
      </div>
      
      {/* Main content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[500px] w-full" />
        </div>
      ) : template ? (
        <>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-4">
              <TemplateEditor 
                projectId={projectId} 
                template={template}
                refetchTemplate={refetch}
              />
            </TabsContent>
            
            <TabsContent value="versions" className="space-y-4">
              <TemplateVersions 
                projectId={projectId} 
                template={template}
                refetchTemplate={refetch}
              />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <TemplateSettings 
                projectId={projectId} 
                template={template}
                refetchTemplate={refetch}
                onDelete={handleBack}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}

// Export the component wrapped with QueryClientProvider
export default function TemplateEditorPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TemplateEditorPageContent />
    </QueryClientProvider>
  );
}