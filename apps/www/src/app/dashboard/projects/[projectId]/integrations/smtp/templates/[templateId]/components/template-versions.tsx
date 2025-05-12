"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  MoreVertical,
  EyeIcon,
  CheckCircle,
  AlertCircle,
  Trash,
  Clock,
} from "lucide-react";
import { toast } from "@workspace/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EmailTemplateVersion,
  activateTemplateVersion,
  updateTemplate,
} from "@/lib/api/email-templates";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api/api";

interface TemplateVersionsProps {
  versions: EmailTemplateVersion[];
  currentVersionId: string | undefined;
  onSwitchVersion: (version: EmailTemplateVersion) => void;
  projectId: string;
  templateId: string;
  hasUnsavedChanges: boolean;
}

// Custom function to delete a template version
const deleteTemplateVersion = async (
  projectId: string,
  templateId: string,
  versionId: string
): Promise<void> => {
  return api.delete<void>(
    `/projects/${projectId}/email-templates/${templateId}/versions/${versionId}`
  );
};

export default function TemplateVersions({
  versions,
  currentVersionId,
  onSwitchVersion,
  projectId,
  templateId,
  hasUnsavedChanges,
}: TemplateVersionsProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string | null>(null);

  // Delete version mutation
  const deleteMutation = useMutation({
    mutationFn: (versionId: string) =>
      deleteTemplateVersion(projectId, templateId, versionId),
    onSuccess: () => {
      toast.success("Template version has been deleted successfully.");
      queryClient.invalidateQueries({
        queryKey: ["templateVersions", projectId, templateId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete version: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Set active version mutation
  const setActiveMutation = useMutation({
    mutationFn: (versionId: string) =>
      activateTemplateVersion(projectId, templateId, versionId),
    onSuccess: () => {
      toast.success("Template version has been set as active successfully.");
      queryClient.invalidateQueries({
        queryKey: ["templateVersions", projectId, templateId],
      });
      queryClient.invalidateQueries({
        queryKey: ["emailTemplate", projectId, templateId],
      });
    },
    onError: (error) => {
      toast.error( `Failed to activate version: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Handle delete version
  const handleDeleteVersion = (versionId: string) => {
    setVersionToDelete(versionId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete version
  const confirmDeleteVersion = () => {
    if (versionToDelete) {
      deleteMutation.mutate(versionToDelete);
      setVersionToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle set as active
  const handleSetActive = (versionId: string) => {
    setActiveMutation.mutate(versionId);
  };

  // Handle preview version
  const handlePreviewVersion = (versionId: string) => {
    router.push(
      `/dashboard/projects/${projectId}/integrations/smtp/templates/${templateId}/versions/${versionId}/preview`
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <>
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this version? This action cannot
              be undone.
              <br />
              <br />
              Note: You cannot delete an active version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteVersion}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Template Versions</CardTitle>
          <CardDescription>
            Manage your template versions. Each version contains a snapshot of
            your template content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions?.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No versions found. Save your template to create a version.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow
                      key={version.id}
                      className={
                        version.id === currentVersionId ? "bg-accent/30" : ""
                      }
                    >
                      <TableCell>
                        <div className="font-medium">v{version.name}</div>
                      </TableCell>
                      <TableCell>
                        {version.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(version.createdAt)}</TableCell>
                      <TableCell>
                        {version.createdAt
                          ? formatDate(version.createdAt)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>

                            {version.id !== currentVersionId && (
                              <DropdownMenuItem
                                onClick={() => onSwitchVersion(version)}
                                disabled={hasUnsavedChanges}
                              >
                                <EyeIcon className="w-4 h-4 mr-2" />
                                View & Edit
                              </DropdownMenuItem>
                            )}

                            {!version.isActive && (
                              <DropdownMenuItem
                                onClick={() => handleSetActive(version.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Set as Active
                              </DropdownMenuItem>
                            )}

                            {!version.isActive && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteVersion(version.id)
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
