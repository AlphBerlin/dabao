"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { useToast } from "@workspace/ui/components/toast/use-toast";
import { Eye, Code, Save, Check, Loader2 } from "lucide-react";
import { TemplatePreview } from "./template-preview";
import { createTemplateVersion, EmailTemplate } from "@/lib/api/email-templates";
import Editor from "@monaco-editor/react";

interface TemplateEditorProps {
  projectId: string;
  template: EmailTemplate;
  refetchTemplate: () => void;
}

export function TemplateEditor({ projectId, template, refetchTemplate }: TemplateEditorProps) {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"design" | "code" | "preview">("design");
  const [htmlContent, setHtmlContent] = useState(template.activeVersion?.html || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const editorRef = useRef<any>(null);
  
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  // Create template version mutation
  const createVersionMutation = useMutation({
    mutationFn: async () => {
      return createTemplateVersion(projectId, template.id, {
        html: htmlContent,
        plainText: htmlContent.replace(/<[^>]*>/g, ''),
        name: `Update ${new Date().toLocaleString()}`,
        isActive: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Template saved",
        description: "Your template has been saved and set as the active version.",
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      refetchTemplate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save template: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await createVersionMutation.mutateAsync();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle design view with WYSIWYG editor (placeholder)
  // In a real implementation, you would integrate a WYSIWYG editor here
  const renderDesignView = () => {
    return (
      <div className="border rounded-lg p-4 h-[600px] flex items-center justify-center">
        <div className="text-center p-8 max-w-lg">
          <h3 className="text-lg font-medium mb-2">Visual Editor Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            The visual drag-and-drop editor is currently in development.
            In the meantime, you can use the code view to edit your template HTML.
          </p>
          <Button onClick={() => setActiveView("code")}>
            <Code className="h-4 w-4 mr-2" /> 
            Switch to Code View
          </Button>
        </div>
      </div>
    );
  };

  // Handle code view with Monaco editor
  const renderCodeView = () => {
    return (
      <div className="border rounded-lg h-[600px] overflow-hidden">
        <Editor
          height="600px"
          language="html"
          value={htmlContent}
          onChange={(value) => setHtmlContent(value || "")}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
          <TabsList>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="code">HTML</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
          ) : isSaved ? (
            <><Check className="h-4 w-4 mr-2" /> Saved</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Save</>
          )}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {activeView === "design" && renderDesignView()}
          {activeView === "code" && renderCodeView()}
          {activeView === "preview" && (
            <TemplatePreview
              html={htmlContent}
              subject={template.subject}
            />
          )}
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        {template.activeVersion ? (
          <p>
            Currently editing version: {template.activeVersion.name || 
              `v${template.activeVersion.versionNumber} (created ${new Date(template.activeVersion.createdAt).toLocaleString()})`
            }
          </p>
        ) : (
          <p>No active version. Save to create the first version.</p>
        )}
      </div>
    </div>
  );
}