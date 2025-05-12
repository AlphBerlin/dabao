"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { ArrowLeft, Save, Loader2, Code, EyeIcon, Settings, Plus } from "lucide-react";
import { useToast } from "@workspace/ui/components/toast/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  fetchTemplate, 
  updateTemplate, 
  fetchTemplateVersions, 
  createTemplateVersion,
  EmailTemplate,
  EmailTemplateVersion,
  UpdateTemplateInput,
  CreateVersionInput
} from "@/lib/api/email-templates";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@workspace/ui/components/breadcrumb";
import { Badge } from "@workspace/ui/components/badge";
import TemplateSettings from "./template-settings";
import TemplateEditor from "./template-editor";
import TemplatePreview from "./template-preview";
import TemplateVersions from "./template-versions";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@workspace/ui/components/alert-dialog";

interface TemplateEditorPageProps {
  projectId: string;
  templateId: string;
  initialTemplate: EmailTemplate;
}

export default function TemplateEditorPage({ 
  projectId, 
  templateId,
  initialTemplate 
}: TemplateEditorPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("editor");
  const [isUnsavedChanges, setIsUnsavedChanges] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<EmailTemplateVersion | null>(
    initialTemplate.versions && initialTemplate.versions.length > 0 ? initialTemplate.versions[0] : null
  );
  const [htmlContent, setHtmlContent] = useState(currentVersion?.htmlContent || "");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});

  // Fetch the latest template data
  const { data: template = initialTemplate } = useQuery({
    queryKey: ["emailTemplate", projectId, templateId],
    queryFn: () => fetchTemplate(projectId, templateId),
    initialData: initialTemplate
  });

  // Fetch template versions
  const { data: versions = [] } = useQuery({
    queryKey: ["templateVersions", projectId, templateId],
    queryFn: () => fetchTemplateVersions(projectId, templateId),
    initialData: initialTemplate.versions || []
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTemplateInput) => updateTemplate(projectId, templateId, data),
    onSuccess: () => {
      toast({
        title: "Template updated",
        description: "Template settings have been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ["emailTemplate", projectId, templateId] });
    },
    onError: (error) => {
      toast({
        title: "Error updating template",
        description: `${error instanceof Error ? error.message : "An error occurred"}`,
        variant: "destructive"
      });
    }
  });

  // Save version mutation
  const saveVersionMutation = useMutation({
    mutationFn: (data: CreateVersionInput) => createTemplateVersion(projectId, templateId, data),
    onSuccess: (data) => {
      toast({
        title: "Version saved",
        description: data.isActive 
          ? "New version has been published and set as active." 
          : "New version has been saved as draft."
      });
      setIsUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["templateVersions", projectId, templateId] });
      queryClient.invalidateQueries({ queryKey: ["emailTemplate", projectId, templateId] });
      setCurrentVersion(data);
    },
    onError: (error) => {
      toast({
        title: "Error saving version",
        description: `${error instanceof Error ? error.message : "An error occurred"}`,
        variant: "destructive"
      });
    }
  });

  // Handle updating template settings
  const handleUpdateTemplate = (data: UpdateTemplateInput) => {
    updateMutation.mutate(data);
  };

  // Handle saving template version
  const handleSaveVersion = (publish: boolean = false) => {
    saveVersionMutation.mutate({
      htmlContent,
      setActive: publish
    });
  };

  // Handle switching versions
  const handleSwitchVersion = (version: EmailTemplateVersion) => {
    const performSwitch = () => {
      setCurrentVersion(version);
      setHtmlContent(version.htmlContent);
      setIsUnsavedChanges(false);
    };

    if (isUnsavedChanges) {
      setPendingAction(performSwitch);
      setShowUnsavedDialog(true);
    } else {
      performSwitch();
    }
  };

  // Handle code changes
  const handleCodeChange = (newCode: string) => {
    setHtmlContent(newCode);
    setIsUnsavedChanges(true);
  };

  // Handle navigation back to templates list
  const handleBackToTemplates = () => {
    if (isUnsavedChanges) {
      setPendingAction(() => {
        router.push(`/dashboard/projects/${projectId}/integrations/smtp`);
      });
      setShowUnsavedDialog(true);
    } else {
      router.push(`/dashboard/projects/${projectId}/integrations/smtp`);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Render status badge
  const renderStatusBadge = () => {
    switch (template.status) {
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="default">Published</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              pendingAction();
              setShowUnsavedDialog(false);
            }}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={handleBackToTemplates} className="cursor-pointer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Templates
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>{template.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>

          <div className="flex justify-between items-center mt-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{template.name}</h1>
                {renderStatusBadge()}
              </div>
              <p className="text-muted-foreground mt-1">
                {template.description || "No description provided"}
              </p>
            </div>
            
            <div className="flex gap-2">
              {isUnsavedChanges && (
                <Button 
                  onClick={() => handleSaveVersion(false)}
                  variant="outline"
                  disabled={saveVersionMutation.isPending}
                >
                  {saveVersionMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <>Save Draft</>
                  )}
                </Button>
              )}
              
              <Button 
                onClick={() => handleSaveVersion(true)}
                disabled={!isUnsavedChanges || saveVersionMutation.isPending}
              >
                {saveVersionMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                ) : (
                  <>Publish</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Editor with tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="editor">
              <Code className="h-4 w-4 mr-2" /> Editor
            </TabsTrigger>
            <TabsTrigger value="preview">
              <EyeIcon className="h-4 w-4 mr-2" /> Preview
            </TabsTrigger>
            <TabsTrigger value="versions">
              <Plus className="h-4 w-4 mr-2" /> Versions
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="mt-4">
            <TemplateEditor 
              htmlContent={htmlContent} 
              onCodeChange={handleCodeChange} 
            />
          </TabsContent>
          
          <TabsContent value="preview" className="mt-4">
            <TemplatePreview 
              htmlContent={htmlContent} 
              subject={template.subject}
              previewText={template.previewText || ""}
            />
          </TabsContent>
          
          <TabsContent value="versions" className="mt-4">
            <TemplateVersions 
              versions={versions}
              currentVersionId={currentVersion?.id}
              onSwitchVersion={handleSwitchVersion}
              projectId={projectId}
              templateId={templateId}
              hasUnsavedChanges={isUnsavedChanges}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-4">
            <TemplateSettings 
              template={template}
              onUpdate={handleUpdateTemplate}
              projectId={projectId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}