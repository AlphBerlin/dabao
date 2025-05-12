"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Separator } from "@workspace/ui/components/separator";

import { Mail, Trash2, AlertCircle, CheckCircle2, LoaderCircle, SendHorizontal, TestTube2 } from "lucide-react";

import { SmtpSettings, SmtpSettingsInput, smtpSettingsSchema, fetchSmtpSettings, saveSmtpSettings, deleteSmtpIntegration, testSmtpConnection, sendTestEmail } from "@/lib/api/smtp";
import { TestEmailDialog } from "./test-email-dialog";

interface SmtpSettingsPageProps {
  projectId: string;
}

// Create a client
const queryClient = new QueryClient();

// Wrap the component with QueryClientProvider
function SmtpSettingsPageContent({ projectId }: SmtpSettingsPageProps) {
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Fetch existing SMTP settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ["smtpSettings", projectId],
    queryFn: () => fetchSmtpSettings(projectId),
  });

  // Set up the form with default values
  const form = useForm<SmtpSettingsInput>({
    resolver: zodResolver(smtpSettingsSchema),
    defaultValues: existingSettings ? {
      host: existingSettings.host,
      port: existingSettings.port,
      secure: existingSettings.secure,
      username: existingSettings.username,
      password: undefined, // Don't prefill password
      senderName: existingSettings.senderName,
      senderEmail: existingSettings.senderEmail,
    } : {
      host: "",
      port: 587,
      secure: true,
      username: "",
      password: "",
      senderName: "",
      senderEmail: "",
    },
  });
  
  // Update form values when existingSettings changes - using useEffect instead of useState
  useEffect(() => {
    if (existingSettings) {
      form.reset({
        host: existingSettings.host,
        port: existingSettings.port,
        secure: existingSettings.secure,
        username: existingSettings.username,
        password: undefined, // Don't prefill password
        senderName: existingSettings.senderName,
        senderEmail: existingSettings.senderEmail,
      });
    }
  }, [existingSettings, form]);

  // Mutations for saving, testing, and deleting settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (data: SmtpSettingsInput) => saveSmtpSettings(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtpSettings", projectId] });
      toast.success("SMTP settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const { mutate: testConnection, isPending: isTesting } = useMutation({
    mutationFn: (data: SmtpSettingsInput) => testSmtpConnection(projectId, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("SMTP connection successful", {
          description: result.message || "Your SMTP settings are working correctly."
        });
      } else {
        toast.error("SMTP connection failed", {
          description: result.message || "Could not connect with the provided settings."
        });
      }
    },
    onError: (error) => {
      toast.error("Connection test failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const { mutate: deleteSettings, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteSmtpIntegration(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtpSettings", projectId] });
      toast.success("SMTP settings removed");
      form.reset({
        host: "",
        port: 587,
        secure: true,
        username: "",
        password: "",
        senderName: "",
        senderEmail: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to remove settings", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const { mutate: sendTest } = useMutation({
    mutationFn: (recipient: string) => sendTestEmail(projectId, recipient),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test email sent successfully", {
          description: result.message || "Check your inbox for the test email."
        });
      } else {
        toast.error("Failed to send test email", {
          description: result.message || "There was a problem sending the test email."
        });
      }
      setIsTestDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Test email failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  function onSubmit(data: SmtpSettingsInput) {
    // If updating an existing configuration and password is empty, 
    // it means we're not changing it, so we'll omit it from the request
    if (existingSettings && !data.password) {
      const { password, ...restData } = data;
      saveSettings(restData as SmtpSettingsInput);
    } else {
      saveSettings(data);
    }
  }

  function handleTestConnection() {
    const formData = form.getValues();
    testConnection(formData);
  }

  function handleDelete() {
    if (confirm("Are you sure you want to remove the SMTP settings? This will disable email functionality.")) {
      deleteSettings();
    }
  }

  function handleSendTestEmail(recipient: string) {
    sendTest(recipient);
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {existingSettings ? "SMTP Configuration" : "Configure SMTP Settings"}
          </CardTitle>
          <CardDescription>
            Configure your SMTP settings to enable sending emails from your application
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!existingSettings && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Setting up SMTP</AlertTitle>
              <AlertDescription>
                <p className="mb-2">You'll need to provide SMTP server details from your email provider.</p>
                <p className="text-sm">
                  Common SMTP providers: 
                  <span className="font-medium ml-1">
                    Gmail (smtp.gmail.com), 
                    Amazon SES (email-smtp.region.amazonaws.com), 
                    SendGrid (smtp.sendgrid.net),
                    Mailgun (smtp.mailgun.org)
                  </span>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="server" className="w-full">
                <TabsList className="w-full md:w-auto grid grid-cols-2">
                  <TabsTrigger value="server">Server Settings</TabsTrigger>
                  <TabsTrigger value="sender">Sender Settings</TabsTrigger>
                </TabsList>
                
                {/* Server Settings Tab */}
                <TabsContent value="server" className="space-y-4 mt-4">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SMTP Host */}
                      <FormField
                        control={form.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Server</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="smtp.example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              The hostname or IP address of your SMTP server
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Port */}
                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Port</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="587" 
                                {...field} 
                                onChange={e => field.onChange(parseInt(e.target.value, 10))}
                                value={field.value}
                              />
                            </FormControl>
                            <FormDescription>
                              Common ports: 25 (standard), 587 (TLS), 465 (SSL)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Secure Connection */}
                    <FormField
                      control={form.control}
                      name="secure"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Use Secure Connection (SSL/TLS)
                            </FormLabel>
                            <FormDescription>
                              Enable secure connections using SSL/TLS (recommended for ports 465)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Username */}
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="your-username" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Your SMTP authentication username (often your email address)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {existingSettings ? "Password (leave empty to keep existing)" : "Password"}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder={existingSettings ? "••••••••" : "your-password"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            {existingSettings 
                              ? "Your password is stored securely. Only enter a new password if you want to change it." 
                              : "Your SMTP authentication password"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Sender Settings Tab */}
                <TabsContent value="sender" className="space-y-4 mt-4">
                  <div className="grid gap-6">
                    {/* Sender Name */}
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your Company Name" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The name displayed in the "From" field of sent emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sender Email */}
                    <FormField
                      control={form.control}
                      name="senderEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="no-reply@yourcompany.com" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The email address used as the sender in sent emails
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />
              
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={handleDelete} 
                    disabled={!existingSettings || isDeleting}
                    className="flex items-center gap-2"
                  >
                    {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Remove Settings
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestConnection} 
                    disabled={isTesting || (!form.formState.isValid && form.formState.isDirty)}
                    className="flex items-center gap-2"
                  >
                    {isTesting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
                    Test Connection
                  </Button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  {existingSettings && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsTestDialogOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <SendHorizontal className="h-4 w-4" />
                      Send Test Email
                    </Button>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={isSaving || !form.formState.isDirty}
                    className="flex items-center gap-2"
                  >
                    {isSaving 
                      ? <LoaderCircle className="h-4 w-4 animate-spin" /> 
                      : <CheckCircle2 className="h-4 w-4" />
                    }
                    {existingSettings ? "Update Settings" : "Save Settings"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        
        {existingSettings && (
          <CardFooter className="border-t bg-muted/50 flex justify-between">
            <p className="text-sm text-muted-foreground">
              Last updated on {new Date(existingSettings.updatedAt).toLocaleDateString()}
            </p>
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span>SMTP configured</span>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Test Email Dialog */}
      <TestEmailDialog 
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        onSendTest={handleSendTestEmail}
      />
    </div>
  );
}

// Export wrapped component with QueryClientProvider
export default function SmtpSettingsPage(props: SmtpSettingsPageProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SmtpSettingsPageContent {...props} />
    </QueryClientProvider>
  );
}