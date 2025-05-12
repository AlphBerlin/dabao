"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { CheckCircle2, AlertCircle, MessageSquare, Mail } from "lucide-react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fetchTelegramSettings } from "@/lib/api/telegram";
import { fetchSmtpSettings } from "@/lib/api/smtp";

// Create a client
const queryClient = new QueryClient();

function IntegrationsPageContent({projectId}: { projectId: string }) {
  
  // Fetch Telegram integration status
  const { data: telegramSettings, isLoading: telegramLoading } = useQuery({
    queryKey: ["telegramSettings", projectId],
    queryFn: () => fetchTelegramSettings(projectId),
  });
  
  // Fetch SMTP integration status
  const { data: smtpSettings, isLoading: smtpLoading } = useQuery({
    queryKey: ["smtpSettings", projectId],
    queryFn: () => fetchSmtpSettings(projectId),
  });

  const integrations = [
    {
      id: "telegram",
      name: "Telegram Bot",
      description: "Connect a Telegram bot to engage with customers, share loyalty updates, and run campaigns",
      icon: MessageSquare,
      status: telegramLoading ? "loading" : (telegramSettings ? "connected" : "not_connected"),
      href: `/dashboard/projects/${projectId}/integrations/telegram`,
    },
    {
      id: "smtp",
      name: "Email (SMTP)",
      description: "Configure SMTP settings to send transactional and campaign emails to your customers",
      icon: Mail,
      status: smtpLoading ? "loading" : (smtpSettings ? "connected" : "not_connected"),
      href: `/dashboard/projects/${projectId}/integrations/smtp`,
    },
    // Add other integrations here in the future
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>
      <p className="text-muted-foreground mb-8">
        Connect your loyalty program with third-party services to extend functionality.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <integration.icon className="h-10 w-10 text-primary" />
                {integration.status === "connected" ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-5 w-5 mr-1" />
                    <span>Connected</span>
                  </div>
                ) : integration.status === "loading" ? (
                  <div className="flex items-center text-yellow-600">
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-400">
                    <AlertCircle className="h-5 w-5 mr-1" />
                    <span>Not Connected</span>
                  </div>
                )}
              </div>
              <CardTitle className="mt-4">{integration.name}</CardTitle>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Integration-specific content can go here */}
            </CardContent>
            <CardFooter>
              <Link href={integration.href} className="w-full">
                <Button className="w-full">
                  {integration.status === "connected" ? "Manage" : "Connect"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function IntegrationsPage({projectId}: { projectId: string }) {
  return (
    <QueryClientProvider client={queryClient}>
      <IntegrationsPageContent projectId={projectId}/>
    </QueryClientProvider>
  );
}
