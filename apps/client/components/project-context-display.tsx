'use client';

import { useProjectContext } from "@/hooks/useProjectContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { AlertTriangle } from 'lucide-react';

export function ProjectContextDisplay() {
  const { projectId, projectSlug, domain, isLoading, error } = useProjectContext();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-1/2" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error || !projectId) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Project Context Error</AlertTitle>
        <AlertDescription>
          {error || "Failed to load project context. Please refresh the page or contact support."}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Context</CardTitle>
        <CardDescription>
          This content is specific to this project domain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-medium">Project ID:</span> {projectId}
          </div>
          <div>
            <span className="font-medium">Project Slug:</span> {projectSlug}
          </div>
          <div>
            <span className="font-medium">Domain:</span> {domain}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
