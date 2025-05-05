"use client";

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { CalendarIcon, ImageIcon, Send } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { format } from "date-fns";
import { toast } from "@workspace/ui/components/sonner";

const telegramCampaignSchema = z.object({
  messageTemplate: z
    .string()
    .min(1, "Message template is required")
    .max(4096, "Telegram messages can't exceed 4096 characters"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  scheduledFor: z.date().optional(),
  buttons: z
    .array(
      z.object({
        text: z.string().min(1, "Button text is required"),
        url: z.string().url("Must be a valid URL").optional(),
        callbackData: z.string().optional(),
      })
    )
    .optional(),
  audienceFilter: z.object({
    hasSubscribed: z.boolean().optional(),
    lastActiveAfter: z.date().optional(),
    hasPoints: z.boolean().optional(),
    minPoints: z.number().optional(),
  }).optional(),
});

type TelegramCampaignFormProps = {
  projectId: string;
  campaignId?: string;
  telegramCampaignId?: string;
  onSuccess?: (data: any) => void;
};

export function TelegramCampaignForm({
  projectId,
  campaignId,
  telegramCampaignId,
  onSuccess,
}: TelegramCampaignFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [telegramSettings, setTelegramSettings] = useState<any>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const form = useForm<z.infer<typeof telegramCampaignSchema>>({
    resolver: zodResolver(telegramCampaignSchema),
    defaultValues: {
      messageTemplate: "",
      imageUrl: "",
      buttons: [],
      audienceFilter: {
        hasSubscribed: true,
      },
    },
  });

  useEffect(() => {
    const loadTelegramSettings = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/integrations/telegram/settings`);
        if (response.ok) {
          const data = await response.json();
          setTelegramSettings(data);
        }
      } catch (error) {
        console.error("Failed to load Telegram settings:", error);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadTelegramSettings();
  }, [projectId]);

  useEffect(() => {
    const loadCampaignData = async () => {
      if (!telegramCampaignId) return;

      try {
        const response = await fetch(
          `/api/projects/${projectId}/integrations/telegram/campaigns/${telegramCampaignId}`
        );
        if (response.ok) {
          const data = await response.json();
          form.reset({
            messageTemplate: data.messageTemplate,
            imageUrl: data.imageUrl || "",
            scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
            buttons: data.buttons || [],
            audienceFilter: data.audienceFilter || { hasSubscribed: true },
          });
        }
      } catch (error) {
        console.error("Failed to load Telegram campaign data:", error);
      }
    };

    loadCampaignData();
  }, [projectId, telegramCampaignId, form]);

  const onSubmit = async (values: z.infer<typeof telegramCampaignSchema>) => {
    try {
      setIsSaving(true);

      const endpoint = telegramCampaignId
        ? `/api/projects/${projectId}/integrations/telegram/campaigns/${telegramCampaignId}`
        : `/api/projects/${projectId}/integrations/telegram/campaigns`;

      const method = telegramCampaignId ? "PATCH" : "POST";

      const body = {
        ...values,
        campaignId,
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to save Telegram campaign");
      }

      const data = await response.json();

      toast.success(`Telegram campaign ${telegramCampaignId ? "updated" : "created"} successfully`);

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error("Error saving Telegram campaign:", error);
      toast.error( "Failed to save Telegram campaign. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!settingsLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Campaign</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!telegramSettings || !telegramSettings?.botToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram Campaign</CardTitle>
          <CardDescription>Configure Telegram integration first</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You need to set up your Telegram bot integration before creating Telegram campaigns.
          </p>
          <Button asChild>
            <a href={`/dashboard/projects/${projectId}/integrations/telegram`}>
              Setup Telegram Integration
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram Campaign</CardTitle>
        <CardDescription>
          Create a Telegram campaign to send messages directly to your subscribers
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div>
              <Badge className="mb-2">{telegramSettings.botUsername}</Badge>
              <p className="text-sm text-muted-foreground">
                Messages will be sent from this Telegram bot
              </p>
            </div>
            
            <FormField
              control={form.control}
              name="messageTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your message content here..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    You can use placeholders like {"{name}"}, {"{points}"} that will be replaced with customer data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                      {field.value && (
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => window.open(field.value, "_blank")}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add an image to your Telegram message (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledFor"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Schedule Send (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP 'at' p")
                          ) : (
                            <span>Select date and time</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Set time to current time
                            const now = new Date();
                            date.setHours(now.getHours(), now.getMinutes());
                          }
                          field.onChange(date);
                        }}
                        initialFocus
                      />
                      {field.value && (
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":");
                              const date = new Date(field.value!);
                              date.setHours(parseInt(hours!, 10), parseInt(minutes!, 10));
                              field.onChange(date);
                            }}
                            defaultValue={format(field.value, "HH:mm")}
                          />
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Schedule when this message should be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
              {!isSaving && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}