"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import { Plus, BarChart3, SendHorizonal, Calendar, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { fetchTelegramCampaigns } from "@/lib/api/telegram";

interface TelegramCampaignsPanelProps {
  projectId: string;
}

export default function TelegramCampaignsPanel({ projectId }: TelegramCampaignsPanelProps) {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["telegramCampaigns", projectId],
    queryFn: () => fetchTelegramCampaigns(projectId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Telegram Campaigns</h2>
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-4 w-3/4 mt-2" />
                <Skeleton className="h-2 w-full mt-6" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-16" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Telegram Campaigns</h2>
        <Link href={`/dashboard/projects/${projectId}/integrations/telegram/campaigns/new`}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </Link>
      </div>
      
      {(!campaigns || campaigns.length === 0) ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center px-4">
            <div className="rounded-full bg-muted p-3 mb-4">
              <SendHorizonal className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl mb-2">No campaigns yet</CardTitle>
            <CardDescription className="mb-6 max-w-md">
              Create your first Telegram campaign to engage with your customers through the Telegram bot.
            </CardDescription>
            <Link href={`/dashboard/projects/${projectId}/integrations/telegram/campaigns/new`}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Create Your First Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {campaigns.map((campaign) => {
            // Calculate engagement rate
            const deliveryRate = campaign.sentCount > 0 
              ? (campaign.deliveredCount / campaign.sentCount) * 100 
              : 0;
            
            const readRate = campaign.deliveredCount > 0 
              ? (campaign.readCount / campaign.deliveredCount) * 100 
              : 0;
            
            const clickRate = campaign.readCount > 0 
              ? (campaign.clickCount / campaign.readCount) * 100 
              : 0;
            
            return (
              <Card key={campaign.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{campaign.name}</CardTitle>
                    <CampaignStatusBadge status={getCampaignStatus(campaign)} />
                  </div>
                  <CardDescription>
                    {campaign.sentCount} messages sent
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">Delivered</span>
                      <span className="font-semibold">{deliveryRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">Read</span>
                      <span className="font-semibold">{readRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">Clicked</span>
                      <span className="font-semibold">{clickRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <Progress value={deliveryRate} className="h-2 mb-1" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{campaign.deliveredCount} delivered</span>
                    <span>{campaign.readCount} read</span>
                    <span>{campaign.clickCount} clicked</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created on {new Date().toLocaleDateString()}</span>
                  </div>
                  <Link href={`/dashboard/projects/${projectId}/integrations/telegram/campaigns/${campaign.id}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const getStatusProps = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return { variant: 'outline' as const, label: 'Draft' };
      case 'SCHEDULED':
        return { variant: 'secondary' as const, label: 'Scheduled' };
      case 'SENDING':
        return { variant: 'default' as const, label: 'Sending' };
      case 'COMPLETED':
        return { variant: 'success' as const, label: 'Completed' };
      case 'CANCELLED':
        return { variant: 'destructive' as const, label: 'Cancelled' };
      case 'FAILED':
        return { variant: 'destructive' as const, label: 'Failed' };
      default:
        return { variant: 'outline' as const, label: status };
    }
  };

  const { variant, label } = getStatusProps(status);
  
  return (
    <Badge variant={variant}>{label}</Badge>
  );
}

// Helper function to determine campaign status from stats
function getCampaignStatus(campaign: any) {
  // This is a simple implementation - in a real app, you would get this from the API
  if (campaign.sentCount === 0) return 'DRAFT';
  if (campaign.sentCount > 0 && campaign.sentCount > campaign.deliveredCount) return 'SENDING';
  return 'COMPLETED';
}
