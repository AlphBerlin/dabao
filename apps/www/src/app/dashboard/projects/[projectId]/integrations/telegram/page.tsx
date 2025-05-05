"use client";

import { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  useQuery,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { fetchTelegramSettings } from "@/lib/api/telegram";

import TelegramSettingsForm from "./components/telegram-settings-form";
import TelegramAnalyticsPanel from "./components/telegram-analytics-panel";
import TelegramCampaignsPanel from "./components/telegram-campaigns-panel";
import TelegramUsersPanel from "./components/telegram-users-panel";
import TelegramCommandsPanel from "./components/telegram-commands-panel";
import TelegramMenusPanel from "./components/telegram-menus-panel";

// Create a client
const queryClient = new QueryClient();

function TelegramIntegrationContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [activeTab, setActiveTab] = useState("settings");

  const { data: telegramSettings, isLoading } = useQuery({
    queryKey: ["telegramSettings", projectId],
    queryFn: () => fetchTelegramSettings(projectId),
  });

  const isConnected = !!telegramSettings;

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold">Telegram Bot Integration</h1>
        <p className="text-muted-foreground">
          Connect your loyalty program with Telegram to engage your customers
          directly through messaging.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {isConnected && (
            <>
              <TabsTrigger value="commands">Commands</TabsTrigger>
              <TabsTrigger value="menus">Menus</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="settings" className="mt-0">
          <TelegramSettingsForm
            projectId={projectId}
            existingSettings={telegramSettings}
            isLoading={isLoading}
          />
        </TabsContent>

        {isConnected && (
          <>
            <TabsContent value="commands" className="mt-0">
              <TelegramCommandsPanel projectId={projectId} />
            </TabsContent>

            <TabsContent value="menus">
              <TelegramMenusPanel projectId={projectId} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <TelegramAnalyticsPanel projectId={projectId} />
            </TabsContent>

            <TabsContent value="campaigns" className="mt-0">
              <TelegramCampaignsPanel projectId={projectId} />
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <TelegramUsersPanel projectId={projectId} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

export default function TelegramIntegrationPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramIntegrationContent />
    </QueryClientProvider>
  );
}
