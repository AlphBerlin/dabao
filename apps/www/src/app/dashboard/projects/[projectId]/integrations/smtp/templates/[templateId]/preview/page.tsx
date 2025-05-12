import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchTemplate } from "@/lib/api/email-templates";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";

interface PreviewPageProps {
  params: {
    projectId: string;
    templateId: string;
  };
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { projectId, templateId } = params;
  
  try {
    // Server-side fetch of template
    const template = await fetchTemplate(projectId, templateId);
    
    // Find active version
    const activeVersion = template.versions?.find(v => v.isActive);
    const htmlContent = activeVersion?.htmlContent || "";
    
    return (
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b py-3 px-4 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            asChild
          >
            <Link href={`/dashboard/projects/${projectId}/integrations/smtp/templates/${templateId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Editor
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Preview: {template.name}</h1>
            <p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
          </div>
        </header>
        
        <main className="flex-1 bg-gray-100 overflow-auto">
          <div className="mx-auto max-w-4xl my-8">
            <iframe
              srcDoc={htmlContent}
              title="Email Preview"
              className="w-full bg-white shadow-md"
              style={{ height: "calc(100vh - 150px)" }}
              frameBorder="0"
            />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error loading template for preview:", error);
    notFound();
  }
}