"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Smartphone, Tablet, Monitor } from "lucide-react";
import { toast } from "@workspace/ui/components/sonner";

interface TemplatePreviewProps {
  html: string;
  subject: string;
  previewText?: string;
}

export function TemplatePreview({ html, subject, previewText }: TemplatePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [loading, setLoading] = useState(true);
  
  // Device dimensions
  const deviceSizes = {
    desktop: { width: '100%', height: '600px' },
    tablet: { width: '768px', height: '600px' },
    mobile: { width: '375px', height: '600px' },
  };

  // Update iframe content when html, subject or device changes
  useEffect(() => {
    if (!iframeRef.current || !html) return;
    
    const updateIframe = () => {
      try {
        setLoading(true);
        
        const iframeDoc = iframeRef.current?.contentDocument;
        if (!iframeDoc) return;
        
        // Create the HTML document with email preview structure
        const completeHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta name="x-apple-disable-message-reformatting">
              <title>${subject}</title>
              ${previewText ? `<meta name="description" content="${previewText}">` : ''}
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }
                .email-preview-wrapper {
                  max-width: 100%;
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>
              <div class="email-preview-wrapper">
                ${html}
              </div>
            </body>
          </html>
        `;
        
        // Write to the iframe
        iframeDoc.open();
        iframeDoc.write(completeHtml);
        iframeDoc.close();
        
        // Handle iframe load completion
        const handleLoad = () => {
          setLoading(false);
        };
        
        const iframeElement = iframeRef.current;
        iframeElement.onload = handleLoad;
        
        return () => {
          if (iframeElement) {
            iframeElement.onload = null;
          }
        };
      } catch (error) {
        setLoading(false);
        toast({
          title: "Preview Error",
          description: "There was an error rendering the email preview.",
          variant: "destructive",
        });
      }
    };
    
    updateIframe();
  }, [html, subject, previewText, device, toast]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-sm">{subject}</h3>
          {previewText && (
            <p className="text-xs text-muted-foreground">{previewText}</p>
          )}
        </div>
        
        <Tabs value={device} onValueChange={(v) => setDevice(v as any)}>
          <TabsList>
            <TabsTrigger value="mobile">
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="tablet">
              <Tablet className="h-4 w-4 mr-2" />
              Tablet
            </TabsTrigger>
            <TabsTrigger value="desktop">
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className={`
        rounded-lg border overflow-hidden
        transition-all duration-300 ease-in-out
        ${device === 'desktop' ? 'w-full mx-auto' : ''}
        ${device === 'tablet' ? 'w-[768px] max-w-full mx-auto' : ''}
        ${device === 'mobile' ? 'w-[375px] max-w-full mx-auto' : ''}
      `}>
        {loading && (
          <div className="flex items-center justify-center bg-muted h-[600px]">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-primary animate-spin mb-2"></div>
              <span className="text-sm text-muted-foreground">Loading preview...</span>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          title="Email Template Preview"
          style={{
            width: deviceSizes[device].width,
            height: deviceSizes[device].height,
            border: 'none',
            opacity: loading ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
}