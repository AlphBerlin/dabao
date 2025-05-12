import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import SmtpSettingsPage from "./components/smtp-settings-page";

interface SmtpIntegrationPageProps {
  params: {
    projectId: string;
  };
}

export default async function SmtpIntegrationPage({ params }: SmtpIntegrationPageProps) {
  const { projectId } = await params;
    return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email (SMTP) Integration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your SMTP settings to send transactional and campaign emails to your customers.
        </p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-6">
          <SmtpSettingsPage projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20 text-center">
            <h3 className="text-xl font-medium">Email Templates</h3>
            <p className="text-muted-foreground mt-2">
              Create and manage email templates for your campaigns and transactional emails.
            </p>
            <p className="text-sm mt-4">
              Email templates feature will be available soon.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="mt-6">
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/20 text-center">
            <h3 className="text-xl font-medium">Email Campaigns</h3>
            <p className="text-muted-foreground mt-2">
              Create, schedule, and track email campaigns to engage with your customers.
            </p>
            <p className="text-sm mt-4">
              Email campaigns feature will be available soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}