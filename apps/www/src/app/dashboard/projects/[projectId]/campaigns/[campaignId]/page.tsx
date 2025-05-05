"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toast } from "@workspace/ui/components/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import {
  Calendar,
  Edit,
  MessageSquare,
  Trash2,
  PauseCircle,
  PlayCircle,
  ArrowLeft,
  BarChart3,
  Users,
  Link,
  Send,
  Clock,
  Check,
} from "lucide-react";
import { format, isAfter, isPast } from "date-fns";
import { TelegramTestMessage } from "@/components/telegram-test-message";

enum CampaignStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED"
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const campaignId = params.campaignId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  
  // Load campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load campaign");
        }
        
        const data = await response.json();
        setCampaign(data);
      } catch (error) {
        console.error("Error loading campaign:", error);
        toast.error("Failed to load campaign data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCampaign();
  }, [projectId, campaignId]);
  
  // Handle toggling campaign status (activate/pause)
  const handleToggleStatus = async () => {
    if (!campaign) return;
    
    try {
      setIsTogglingStatus(true);
      
      const newStatus = campaign.status === CampaignStatus.ACTIVE 
        ? CampaignStatus.PAUSED 
        : CampaignStatus.ACTIVE;
      
      const response = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update campaign status");
      }
      
      const updatedCampaign = await response.json();
      setCampaign(updatedCampaign);
      
      toast.success(`Campaign ${newStatus === CampaignStatus.ACTIVE ? "activated" : "paused"} successfully`);
    } catch (error) {
      console.error("Error toggling campaign status:", error);
      toast.error("Failed to update campaign status. Please try again.");
    } finally {
      setIsTogglingStatus(false);
    }
  };
  
  // Handle sending campaign
  const handleSendCampaign = async () => {
    if (!campaign?.telegramCampaign?.id) return;
    
    try {
      setIsSending(true);
      
      const response = await fetch(
        `/api/projects/${projectId}/integrations/telegram/campaigns/${campaign.telegramCampaign.id}/send`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send campaign");
      }
      
      const result = await response.json();
      
      // Update local campaign data
      setCampaign({
        ...campaign,
        status: CampaignStatus.ACTIVE,
        telegramCampaign: {
          ...campaign.telegramCampaign,
          status: 'SENDING',
          sentAt: new Date(),
        }
      });
      
      toast.success(`Campaign is being sent to ${result.stats?.totalUsers || 'all'} subscribers`);
      setShowSendDialog(false);
      
      // Refresh after a delay to get updated stats
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Error sending campaign:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send campaign");
    } finally {
      setIsSending(false);
    }
  };
  
  // Handle campaign deletion
  const handleDeleteCampaign = async () => {
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/projects/${projectId}/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete campaign");
      }
      
      toast.success("Campaign deleted successfully");
      
      router.push(`/dashboard/projects/${projectId}/campaigns`);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign. Please try again.");
      setIsDeleting(false);
    }
  };
  
  // Format dates for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "PPP");
  };
  
  // Get badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return "bg-green-500";
      case CampaignStatus.PAUSED:
        return "bg-amber-500";
      case CampaignStatus.SCHEDULED:
        return "bg-blue-500";
      case CampaignStatus.COMPLETED:
        return "bg-purple-500";
      case CampaignStatus.CANCELED:
        return "bg-red-500";
      default:
        return "bg-gray-500"; // DRAFT
    }
  };
  
  // Format campaign type for display
  const formatCampaignType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[180px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
        <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <a href={`/dashboard/projects/${projectId}/campaigns`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </a>
        </Button>
      </div>
    );
  }

  const hasTelegramIntegration = !!campaign.telegramCampaign;
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <Badge className="w-fit flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${getStatusColor(campaign.status)}`} />
            {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
          </Badge>
        </div>
        <div className="mt-4 md:mt-0 space-x-2 flex">
          <Button variant="outline" asChild>
            <a href={`/dashboard/projects/${projectId}/campaigns`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </a>
          </Button>
          
          <Button variant="outline" asChild>
            <a href={`/dashboard/projects/${projectId}/campaigns/${campaignId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </a>
          </Button>
          
          {(campaign.status === CampaignStatus.ACTIVE || 
           campaign.status === CampaignStatus.PAUSED) && (
            <Button 
              variant={campaign.status === CampaignStatus.ACTIVE ? "outline" : "default"} 
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
            >
              {campaign.status === CampaignStatus.ACTIVE ? (
                <>
                  <PauseCircle className="mr-2 h-4 w-4" />
                  {isTogglingStatus ? "Pausing..." : "Pause"}
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {isTogglingStatus ? "Activating..." : "Activate"}
                </>
              )}
            </Button>
          )}
          
          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-500 hover:text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the campaign
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCampaign}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {campaign.description && (
        <p className="text-muted-foreground mb-6">{campaign.description}</p>
      )}
      
      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Campaign Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCampaignType(campaign.type)}</div>
            {campaign.type === "POINTS_MULTIPLIER" && campaign.pointsMultiplier && (
              <p className="text-muted-foreground">{campaign.pointsMultiplier}x points multiplier</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Start:</span> 
                <span>{formatDate(campaign.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">End:</span> 
                <span>{formatDate(campaign.endDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Telegram:</span>
                {hasTelegramIntegration ? (
                  <Badge variant="outline" className="ml-1 bg-green-50 text-green-700 border-green-200">
                    <Check className="mr-1 h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="ml-1 bg-gray-50 text-gray-500 border-gray-200">
                    Not configured
                  </Badge>
                )}
              </div>
              
              {!hasTelegramIntegration && (
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href={`/dashboard/projects/${projectId}/campaigns/${campaignId}/edit?tab=telegram`}>
                    <Link className="mr-2 h-3 w-3" />
                    Connect Telegram
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Campaign content tabs */}
      <Tabs defaultValue="details" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          {hasTelegramIntegration && (
            <TabsTrigger value="telegram">
              <MessageSquare className="h-4 w-4 mr-2" />
              Telegram
            </TabsTrigger>
          )}
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                View the details and configuration of this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Campaign ID</h3>
                <p className="text-sm bg-muted p-2 rounded-md font-mono">{campaign.id}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Created</h3>
                <p>{format(new Date(campaign.createdAt), "PPP 'at' p")}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Last Updated</h3>
                <p>{format(new Date(campaign.updatedAt), "PPP 'at' p")}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Rewards</h3>
                {campaign.rewards && campaign.rewards.length > 0 ? (
                  <div className="space-y-2">
                    {campaign.rewards.map((campaignReward: any) => (
                      <div key={campaignReward.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <div>
                          <p className="font-medium">{campaignReward.reward.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaignReward.reward.value} {campaignReward.reward.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No rewards attached to this campaign</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <a href={`/dashboard/projects/${projectId}/campaigns/${campaignId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Campaign Details
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {hasTelegramIntegration && (
          <TabsContent value="telegram">
            <Card>
              <CardHeader>
                <CardTitle>Telegram Campaign</CardTitle>
                <CardDescription>
                  Manage your Telegram messaging campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Message Template</h3>
                  <div className="bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {campaign.telegramCampaign.messageTemplate}
                  </div>
                </div>
                
                {campaign.telegramCampaign.imageUrl && (
                  <div>
                    <h3 className="font-medium mb-2">Image</h3>
                    <div className="overflow-hidden rounded-md border w-full max-w-sm">
                      <img 
                        src={campaign.telegramCampaign.imageUrl} 
                        alt="Campaign image" 
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium mb-2">Schedule</h3>
                  {campaign.telegramCampaign.scheduledFor ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Scheduled for {format(new Date(campaign.telegramCampaign.scheduledFor), "PPP 'at' p")}
                        {isPast(new Date(campaign.telegramCampaign.scheduledFor)) && 
                          <span className="ml-2 text-amber-600">(Past due)</span>
                        }
                      </span>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No schedule set (send manually)</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Status</h3>
                  <Badge className="w-fit">
                    {campaign.telegramCampaign.status.charAt(0) + 
                     campaign.telegramCampaign.status.slice(1).toLowerCase()}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Campaign Metrics</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{campaign.telegramCampaign.sentCount || 0}</span>
                      <span className="text-sm text-muted-foreground">Sent</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{campaign.telegramCampaign.deliveredCount || 0}</span>
                      <span className="text-sm text-muted-foreground">Delivered</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{campaign.telegramCampaign.readCount || 0}</span>
                      <span className="text-sm text-muted-foreground">Read</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{campaign.telegramCampaign.clickCount || 0}</span>
                      <span className="text-sm text-muted-foreground">Clicked</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href={`/dashboard/projects/${projectId}/campaigns/${campaignId}/edit?tab=telegram`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Telegram Campaign
                  </a>
                </Button>
                
                <TelegramTestMessage 
                  projectId={projectId}
                  telegramCampaignId={campaign.telegramCampaign.id}
                  disabled={campaign.telegramCampaign.status === "SENDING"}
                />
                
                {campaign.telegramCampaign.status !== "SENDING" && 
                 campaign.telegramCampaign.status !== "COMPLETED" && (
                  <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Send className="mr-2 h-4 w-4" />
                        Send Campaign
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Telegram Campaign</DialogTitle>
                        <DialogDescription>
                          This will send the campaign message to all eligible subscribers.
                          This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <h3 className="font-medium mb-2">Sending to:</h3>
                        <div className="flex items-center gap-2 mb-4">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>All active subscribers</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Campaign will be sent immediately. Please make sure your message content is correct.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSendDialog(false)} disabled={isSending}>Cancel</Button>
                        <Button onClick={handleSendCampaign} disabled={isSending}>
                          {isSending ? "Sending..." : "Confirm and Send"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
              <CardDescription>
                View performance metrics for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Campaign analytics tracking is currently in development.
                  Check back soon for detailed insights on your campaign performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}