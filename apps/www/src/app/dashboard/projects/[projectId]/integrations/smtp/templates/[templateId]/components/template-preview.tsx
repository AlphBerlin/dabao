"use client";

import { useState } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Input } from "@workspace/ui/components/input";
import { Smartphone, Monitor, Eye } from "lucide-react";

interface TemplatePreviewProps {
  htmlContent: string;
  subject: string;
  previewText: string;
}

export default function TemplatePreview({ 
  htmlContent, 
  subject,
  previewText 
}: TemplatePreviewProps) {
  const [previewType, setPreviewType] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="space-y-4">
      {/* Email metadata preview */}
      <Card className="border">
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-20 text-sm font-medium">From:</div>
              <div className="text-sm text-muted-foreground">Your Company Name &lt;noreply@yourcompany.com&gt;</div>
            </div>
            <div className="flex items-center">
              <div className="w-20 text-sm font-medium">To:</div>
              <div className="text-sm text-muted-foreground">Recipient &lt;recipient@example.com&gt;</div>
            </div>
            <div className="flex items-center">
              <div className="w-20 text-sm font-medium">Subject:</div>
              <div className="text-sm">{subject || "No subject"}</div>
            </div>
            {previewText && (
              <div className="flex items-center">
                <div className="w-20 text-sm font-medium">Preview:</div>
                <div className="text-sm text-muted-foreground italic">{previewText}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email content preview */}
      <Card className="border">
        <CardContent className="p-0">
          <Tabs value={previewType} onValueChange={(value) => setPreviewType(value as "desktop" | "mobile")}>
            <div className="border-b px-3">
              <TabsList className="mt-0">
                <TabsTrigger value="desktop">
                  <Monitor className="h-4 w-4 mr-2" /> Desktop View
                </TabsTrigger>
                <TabsTrigger value="mobile">
                  <Smartphone className="h-4 w-4 mr-2" /> Mobile View
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="desktop" className="m-0">
              <div className="bg-gray-100 p-4">
                <div 
                  className="mx-auto max-w-3xl bg-white shadow-md overflow-auto"
                  style={{ height: "600px" }}
                >
                  <iframe
                    srcDoc={htmlContent}
                    title="Desktop Email Preview"
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                    }}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="mobile" className="m-0">
              <div className="bg-gray-100 p-4 flex justify-center">
                <div 
                  className="w-[375px] bg-white shadow-md overflow-auto"
                  style={{ height: "600px" }}
                >
                  <iframe
                    srcDoc={htmlContent}
                    title="Mobile Email Preview"
                    width="100%"
                    height="100%"
                    style={{
                      border: "none",
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}