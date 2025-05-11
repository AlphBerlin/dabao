import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Separator } from "@workspace/ui/components/separator";
import { BrandingSettings } from "./components/branding-settings";
import { ApiTokenSettings } from "./components/api-token-settings";
import { UserSettings } from "./components/user-settings";
import { requirePermission } from "@/lib/auth/server-auth";
import { ACTION_TYPES, RESOURCE_TYPES } from "@/lib/casbin/enforcer";

export default async function ProjectSettingsPage({ params }: { params: { projectId: string } }) {
  const { projectId } = await params;

  await requirePermission(
      projectId,
      RESOURCE_TYPES.PROJECT_SETTINGS,
      ACTION_TYPES.READ,
      `/projects/${projectId}`  // Redirect to project page if unauthorized
    );
  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 sm:px-6 lg:px-8 pb-20 pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Project Settings</h1>
            <p className="text-muted-foreground">
              Manage your project settings and configuration
            </p>
          </div>
          <Separator className="my-6" />
          
          <Tabs defaultValue="branding" className="w-full">
            <TabsList className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="api-tokens">API Tokens</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>
            <TabsContent value="branding">
              <BrandingSettings projectId={projectId} />
            </TabsContent>
            <TabsContent value="api-tokens">
              <ApiTokenSettings projectId={projectId} />
            </TabsContent>
            <TabsContent value="users">
              <UserSettings projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}