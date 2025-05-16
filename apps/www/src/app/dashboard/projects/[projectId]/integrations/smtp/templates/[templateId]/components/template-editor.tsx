"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import MonacoEditor from "@monaco-editor/react";

interface TemplateEditorProps {
  htmlContent: string;
  onCodeChange: (newCode: string) => void;
}

export default function TemplateEditor({ htmlContent, onCodeChange }: TemplateEditorProps) {
  const [editorType, setEditorType] = useState<"code" | "visual">("code");
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  const handleEditorDidMount = () => {
    setIsEditorReady(true);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onCodeChange(value);
    }
  };

  const options = {
    minimap: { enabled: false },
    wordWrap: "on" as const,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
  };

  // Example initial HTML template if none exists
  const initialHtml = htmlContent || `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    .header {
      background-color: #4F46E5;
      color: #ffffff;
      padding: 20px;
      text-align: center;
    }
    .content {
      padding: 20px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #666666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Email Title</h1>
    </div>
    <div class="content">
      <h2>Hello {{name}},</h2>
      <p>This is a sample email template. You can customize it to fit your needs.</p>
      <p>Here's some more content for your email:</p>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
        <li>Item 3</li>
      </ul>
      <p>If you have any questions, feel free to reach out!</p>
      <p>Best regards,<br>Your Name</p>
    </div>
    <div class="footer">
      <p>© 2025 Your Company. All rights reserved.</p>
      <p>You are receiving this email because you signed up for our service.</p>
      <p><a href="{{unsubscribe_link}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

  return (
    <Card className="border">
      <CardContent className="p-0">
        <Tabs value={editorType} onValueChange={(value) => setEditorType(value as "code" | "visual")}>
          <div className="border-b px-3">
            <TabsList className="mt-0">
              <TabsTrigger value="code">HTML Code</TabsTrigger>
              <TabsTrigger value="visual" disabled>Visual Editor (Coming soon)</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="code" className="m-0">
            <div className="h-[600px] w-full border-0">
              <MonacoEditor
                height="600px"
                language="html"
                value={initialHtml}
                options={options}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-light"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="visual" className="m-0">
            <div className="h-[600px] flex items-center justify-center p-6 text-center text-muted-foreground">
              <div>
                <p className="text-lg">Visual Editor Coming Soon</p>
                <p className="text-sm mt-2">
                  This feature is under development. For now, you can use the HTML editor to create your template.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}