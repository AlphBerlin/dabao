"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@workspace/ui/components/dialog";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { useToast } from "@workspace/ui/components/toast/use-toast";
import { Check, Clock, HistoryIcon } from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@workspace/ui/components/table";
import { TemplatePreview } from "./template-preview";
import { 
  activateTemplateVersion, 
  EmailTemplate, 
  EmailTemplateVersion, 
  fetchTemplateVersions 
} from "@/lib/api/email-templates";
import { format } from "date-fns";

interface TemplateVersionsProps {
  projectId: string;
  template: EmailTemplate;
  refetchTemplate: () => void;
}

export function TemplateVersions({ projectId, template, refetchTemplate }: TemplateVersionsProps) {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<EmailTemplateVersion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showDifferences, setShowDifferences] = useState(false);
  
  // Fetch versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['template-versions', projectId, template.id],
    queryFn: () => fetchTemplateVersions(projectId, template.id),
  });
  
  // Activate version mutation
  const activateMutation = useMutation({
    mutationFn: (versionId: string) => 
      activateTemplateVersion(projectId, template.id, versionId),
    onSuccess: () => {
      toast({
        title: "Version activated",
        description: "Template version has been set as active.",
      });
      refetchTemplate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to activate version: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  const handleActivateVersion = (version: EmailTemplateVersion) => {
    if (!version.isActive) {
      activateMutation.mutate(version.id);
    }
  };
  
  const handlePreviewVersion = (version: EmailTemplateVersion) => {
    setSelectedVersion(version);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <HistoryIcon className="mr-2 h-5 w-5" /> Version History
          </CardTitle>
          <CardDescription>
            Manage previous versions of this email template
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin"></div>
                <span className="text-sm text-muted-foreground">Loading versions...</span>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-8 text-center border rounded-md">
              <p className="text-muted-foreground">No versions available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Save changes to create a new version.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="show-differences" 
                    checked={showDifferences}
                    onCheckedChange={(checked) => setShowDifferences(!!checked)}
                  />
                  <label 
                    htmlFor="show-differences" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show differences (coming soon)
                  </label>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Version</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px] text-right">Status</TableHead>
                      <TableHead className="w-[150px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">v{version.versionNumber}</TableCell>
                        <TableCell>
                          {version.name || `Version ${version.versionNumber}`}
                        </TableCell>
                        <TableCell>
                          {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell className="text-right">
                          {version.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Check className="mr-1 h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePreviewVersion(version)}
                            >
                              Preview
                            </Button>
                            
                            {!version.isActive && (
                              <Button
                                size="sm"
                                disabled={activateMutation.isPending}
                                onClick={() => handleActivateVersion(version)}
                              >
                                {activateMutation.isPending ? (
                                  <><div className="h-3 w-3 rounded-full border-2 border-t-transparent border-background animate-spin mr-1"></div> Setting</>
                                ) : (
                                  'Set Active'
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Version Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>
              Version Preview - {selectedVersion?.name || `v${selectedVersion?.versionNumber}`}
            </DialogTitle>
            <DialogDescription>
              Created {selectedVersion && format(new Date(selectedVersion.createdAt), 'MMMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="max-h-[600px] overflow-y-auto">
              <TemplatePreview
                html={selectedVersion.html}
                subject={template.subject}
                previewText={template.previewText}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            {selectedVersion && !selectedVersion.isActive && (
              <Button 
                onClick={() => {
                  handleActivateVersion(selectedVersion);
                  setIsPreviewOpen(false);
                }}
                disabled={activateMutation.isPending}
              >
                {activateMutation.isPending ? (
                  <><div className="h-4 w-4 rounded-full border-2 border-t-transparent border-background animate-spin mr-2"></div> Setting as Active</>
                ) : (
                  'Set as Active Version'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}