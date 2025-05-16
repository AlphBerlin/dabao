"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Bot, Trash2, AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import { TelegramSettings, saveTelegramSettings, deleteTelegramIntegration } from "@/lib/api/telegram";

const telegramFormSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  botUsername: z.string().min(1, "Bot username is required"),
  webhookUrl: z.string().url("Must be a valid URL").nullable().optional(),
  welcomeMessage: z.string().nullable().optional(),
  helpMessage: z.string().nullable().optional(),
  enableCommands: z.boolean().default(true),
});

interface TelegramSettingsFormProps {
  projectId: string;
  existingSettings: TelegramSettings | null;
  isLoading: boolean;
}

export default function TelegramSettingsForm({ 
  projectId, 
  existingSettings, 
  isLoading 
}: TelegramSettingsFormProps) {
  // const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // Set up the form with default values
  const form = useForm<z.infer<typeof telegramFormSchema>>({
    resolver: zodResolver(telegramFormSchema),
    defaultValues: existingSettings ? {
      botToken: existingSettings.botToken,
      botUsername: existingSettings.botUsername,
      webhookUrl: existingSettings.webhookUrl,
      welcomeMessage: existingSettings.welcomeMessage,
      helpMessage: existingSettings.helpMessage,
      enableCommands: existingSettings.enableCommands,
    } : {
      botToken: "",
      botUsername: "",
      webhookUrl: null,
      welcomeMessage: "Welcome to our loyalty bot! 🎉\n\nUse /help to see available commands.",
      helpMessage: null,
      enableCommands: true,
    }
  });

  // Set up mutation for saving settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (data: z.infer<typeof telegramFormSchema>) => 
      saveTelegramSettings(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramSettings", projectId] });
      toast.success("Telegram bot settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save settings", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Set up mutation for deleting integration
  const { mutate: deleteIntegration, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteTelegramIntegration(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegramSettings", projectId] });
      toast.success("Telegram integration disconnected");
      form.reset({
        botToken: "",
        botUsername: "",
        webhookUrl: null,
        welcomeMessage: "Welcome to our loyalty bot! 🎉\n\nUse /help to see available commands.",
        helpMessage: null,
        enableCommands: true,
      });
    },
    onError: (error) => {
      toast.error("Failed to disconnect integration", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  function onSubmit(data: z.infer<typeof telegramFormSchema>) {
    saveSettings(data);
  }

  function handleDelete() {
    if (confirm("Are you sure you want to disconnect this Telegram bot? This action cannot be undone.")) {
      deleteIntegration();
    }
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
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          {existingSettings ? "Telegram Bot Configuration" : "Connect Telegram Bot"}
        </CardTitle>
        <CardDescription>
          {existingSettings
            ? "Manage your connected Telegram bot settings"
            : "Connect a Telegram bot to engage with your customers through messaging"}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!existingSettings && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Before you begin</AlertTitle>
            <AlertDescription>
              <p className="mb-2">You'll need to create a Telegram bot and get its API token. Follow these steps:</p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>Open Telegram and search for <strong>@BotFather</strong></li>
                <li>Send the command <code>/newbot</code> and follow the instructions</li>
                <li>Choose a name and username for your bot</li>
                <li>BotFather will give you an API token - copy this token</li>
                <li>Paste the token below to connect your bot</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="botToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Token</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your Telegram bot token" 
                      {...field} 
                      type="password" 
                    />
                  </FormControl>
                  <FormDescription>
                    The API token provided by BotFather when you created your bot
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="botUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bot Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., MyLoyaltyBot" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The username of your bot (without the @ symbol)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://your-webhook-url.com/telegram-webhook" 
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Advanced: If you're hosting your own webhook, enter the URL here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="welcomeMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Welcome Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the message users will see when they start the bot" 
                      className="resize-y min-h-[100px]"
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    The message users will receive when they first start the bot
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="helpMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Help Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter help information for your users" 
                      className="resize-y min-h-[100px]"
                      {...field} 
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Information shown when users request help
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableCommands"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Commands</FormLabel>
                    <FormDescription>
                      Enable standard bot commands like /points, /rewards, etc.
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

            <div className="flex justify-between pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={!existingSettings || isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Disconnect Bot
              </Button>
              
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving 
                  ? <LoaderCircle className="h-4 w-4 animate-spin" /> 
                  : <CheckCircle2 className="h-4 w-4" />
                }
                {existingSettings ? "Update Settings" : "Connect Bot"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      
      {existingSettings && (
        <CardFooter className="border-t bg-muted/50 flex justify-between">
          <p className="text-sm text-muted-foreground">
            Connected on {new Date(existingSettings.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center text-green-600 text-sm">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            <span>Bot connected and active</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
