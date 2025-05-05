"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CalendarIcon, MessageSquare, Save } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@workspace/ui/lib/utils";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toast } from "@workspace/ui/components/sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import { TelegramCampaignForm } from "@/components/telegram-campaign-form";

const campaignFormSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  type: z.string(),
  pointsMultiplier: z.coerce.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

enum CampaignType {
  WELCOME = "WELCOME",
  REFERRAL = "REFERRAL",
  POINTS_MULTIPLIER = "POINTS_MULTIPLIER",
  BIRTHDAY = "BIRTHDAY",
  ANNIVERSARY = "ANNIVERSARY",
  PROMOTION = "PROMOTION",
  SPECIAL_EVENT = "SPECIAL_EVENT",
  HOLIDAY = "HOLIDAY",
  CUSTOM = "CUSTOM"
}

export default function EditCampaignPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const campaignId = params.campaignId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "CUSTOM",
      pointsMultiplier: 1,
    },
  });

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load campaign");
        }
        
        const campaignData = await response.json();
        setCampaign(campaignData);
        
        form.reset({
          name: campaignData.name,
          description: campaignData.description || "",
          type: campaignData.type,
          pointsMultiplier: campaignData.pointsMultiplier || 1,
          startDate: campaignData.startDate ? new Date(campaignData.startDate) : undefined,
          endDate: campaignData.endDate ? new Date(campaignData.endDate) : undefined,
        });
      } catch (error) {
        console.error("Error loading campaign:", error);
        toast.error("Failed to load campaign data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaign();
  }, [projectId, campaignId, form, toast]);

  const onSubmit = async (values: z.infer<typeof campaignFormSchema>) => {
    try {
      setIsSaving(true);
      
      const response = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update campaign");
      }
      
      const updated = await response.json();
      setCampaign(updated);
      
      toast.success("Campaign updated successfully");
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Edit Campaign</h1>
          <p className="text-muted-foreground">
            Update your campaign settings and integrations
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild variant="outline">
            <a href={`/dashboard/projects/${projectId}/campaigns/${campaignId}`}>
              Back to Campaign
            </a>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="telegram">
            <MessageSquare className="h-4 w-4 mr-2" />
            Telegram
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Information</CardTitle>
              <CardDescription>
                Update your campaign details
              </CardDescription>
            </CardHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter campaign name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your campaign"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select campaign type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CampaignType).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                  {key.split('_').map(word => 
                                    word.charAt(0) + word.slice(1).toLowerCase()
                                  ).join(' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("type") === "POINTS_MULTIPLIER" && (
                      <FormField
                        control={form.control}
                        name="pointsMultiplier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Points Multiplier</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="0.1"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              How many times to multiply points earned
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
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
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>No start date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("2000-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When the campaign will become active
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
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
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>No end date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => 
                                  date < new Date("2000-01-01") ||
                                  (form.getValues("startDate") && date < form.getValues("startDate"))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When the campaign will end (optional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                    {!isSaving && <Save className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
        
        <TabsContent value="telegram">
          <TelegramCampaignForm 
            projectId={projectId} 
            campaignId={campaignId} 
            telegramCampaignId={campaign?.telegramCampaign?.id}
            onSuccess={(data) => {
              // Update local campaign data with new Telegram campaign info
              setCampaign({
                ...campaign,
                telegramCampaign: data
              });
              
              toast.success("Telegram campaign settings saved successfully");
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}