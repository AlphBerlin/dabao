import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";

export default function TemplateNotFound() {
  return (
    <div className="container py-12">
      <div className="flex flex-col items-center justify-center text-center space-y-6">
        <div className="bg-muted rounded-full p-6">
          <span className="text-5xl">🔍</span>
        </div>
        <h2 className="text-3xl font-bold">Template Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The email template you are looking for doesn't exist or you don't have permission to access it.
        </p>
        <Button asChild>
          <Link href="../" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Email Templates
          </Link>
        </Button>
      </div>
    </div>
  );
}