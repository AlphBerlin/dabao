"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  MoreHorizontal,
  Calendar,
  Users,
  BarChart3,
  Megaphone,
  Clock,
  Play,
  Pause,
} from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Pagination } from "@/components/pagination";
import { format, isAfter, isBefore, parseISO } from "date-fns";

// Types
enum CampaignStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED"
}

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

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  pointsMultiplier: number | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    customers: number;
    rewards: number;
    activities: number;
  };
}

export default function CampaignsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  
  // Parse search params
  const currentTab = searchParams.get("tab") || "active";
  const searchQuery = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page") || "1");
  const pageSize = 10;
  
  // State
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState(searchQuery);
  
  // Load campaigns data
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        let statusFilter = "";
        
        if (currentTab === "active") {
          statusFilter = "status=ACTIVE";
        } else if (currentTab === "scheduled") {
          statusFilter = "status=SCHEDULED";
        } else if (currentTab === "completed") {
          statusFilter = "status=COMPLETED";
        } else if (currentTab === "draft") {
          statusFilter = "status=DRAFT";
        }
        
        const url = `/api/projects/${projectId}/campaigns?page=${currentPage}&limit=${pageSize}${statusFilter ? `&${statusFilter}` : ""}${searchQuery ? `&search=${searchQuery}` : ""}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to load campaigns");
        }
        
        const data = await response.json();
        setCampaigns(data.campaigns);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, [projectId, currentTab, currentPage, searchQuery]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    
    params.set("page", "1");
    router.push(`/dashboard/projects/${projectId}/campaigns?${params.toString()}`);
  };
  
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    params.set("page", "1");
    router.push(`/dashboard/projects/${projectId}/campaigns?${params.toString()}`);
  };
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/dashboard/projects/${projectId}/campaigns?${params.toString()}`);
  };
  
  const toggleCampaignStatus = async (id: string, currentStatus: CampaignStatus) => {
    try {
      let newStatus: CampaignStatus;
      
      if (currentStatus === CampaignStatus.ACTIVE) {
        newStatus = CampaignStatus.PAUSED;
      } else if (currentStatus === CampaignStatus.PAUSED || currentStatus === CampaignStatus.SCHEDULED) {
        newStatus = CampaignStatus.ACTIVE;
      } else {
        return; // Can't toggle other statuses
      }
      
      const response = await fetch(`/api/projects/${projectId}/campaigns/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update campaign status");
      }
      
      // Update campaigns locally
      setCampaigns(campaigns.map(campaign => 
        campaign.id === id ? { ...campaign, status: newStatus } : campaign
      ));
      
    } catch (error) {
      console.error("Error updating campaign status:", error);
    }
  };
  
  const getCampaignIcon = (type: CampaignType) => {
    switch (type) {
      case CampaignType.WELCOME:
        return <Users className="h-4 w-4 text-blue-500" />;
      case CampaignType.REFERRAL:
        return <Users className="h-4 w-4 text-purple-500" />;
      case CampaignType.POINTS_MULTIPLIER:
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case CampaignType.BIRTHDAY:
      case CampaignType.ANNIVERSARY:
        return <Calendar className="h-4 w-4 text-pink-500" />;
      default:
        return <Megaphone className="h-4 w-4 text-orange-500" />;
    }
  };
  
  const getStatusBadge = (campaign: Campaign) => {
    const { status, startDate, endDate } = campaign;
    let color = "bg-gray-500";
    
    switch (status) {
      case CampaignStatus.ACTIVE:
        color = "bg-green-500";
        break;
      case CampaignStatus.PAUSED:
        color = "bg-amber-500";
        break;
      case CampaignStatus.SCHEDULED:
        color = "bg-blue-500";
        break;
      case CampaignStatus.COMPLETED:
        color = "bg-purple-500";
        break;
      case CampaignStatus.CANCELED:
        color = "bg-red-500";
        break;
      default:
        color = "bg-gray-500"; // DRAFT
    }
    
    let statusText = status.charAt(0) + status.slice(1).toLowerCase();
    
    // Check for campaigns that are scheduled but might be scheduled for future or expired
    if (status === CampaignStatus.SCHEDULED && startDate) {
      const now = new Date();
      const start = parseISO(startDate);
      
      if (isBefore(start, now)) {
        statusText = "Starting soon";
      }
    }
    
    // Check for active campaigns that might be ending soon
    if (status === CampaignStatus.ACTIVE && endDate) {
      const now = new Date();
      const end = parseISO(endDate);
      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
      
      if (isBefore(end, oneDayFromNow) && isAfter(end, now)) {
        statusText = "Ending soon";
        color = "bg-amber-500";
      }
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {statusText}
      </Badge>
    );
  };
  
  const formatDateRange = (startDate: string | null, endDate: string | null) => {
    if (!startDate && !endDate) return "No date set";
    
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      
      if (format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
        // Same day
        return `${format(start, "MMM d, yyyy")} (${format(start, "h:mm a")} - ${format(end, "h:mm a")})`;
      }
      
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }
    
    if (startDate) {
      return `From ${format(parseISO(startDate), "MMM d, yyyy")}`;
    }
    
    return `Until ${format(parseISO(endDate!), "MMM d, yyyy")}`;
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage your marketing campaigns
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <a href={`/dashboard/projects/${projectId}/campaigns/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Campaign
            </a>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSearch} className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search campaigns..."
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
        
        <div className="mt-6">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-5 w-[250px]" />
                      <Skeleton className="h-4 w-[400px]" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : campaigns.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {campaign.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getCampaignIcon(campaign.type)}
                            <span>
                              {campaign.type.split('_').map(word => 
                                word.charAt(0) + word.slice(1).toLowerCase()
                              ).join(' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {formatDateRange(campaign.startDate, campaign.endDate)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span>{campaign._count.customers}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3 text-muted-foreground" />
                              <span>{campaign._count.activities}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <a href={`/dashboard/projects/${projectId}/campaigns/${campaign.id}`}>
                                    View Details
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <a href={`/dashboard/projects/${projectId}/campaigns/${campaign.id}/edit`}>
                                    Edit Campaign
                                  </a>
                                </DropdownMenuItem>
                                {(campaign.status === CampaignStatus.ACTIVE || 
                                  campaign.status === CampaignStatus.PAUSED ||
                                  campaign.status === CampaignStatus.SCHEDULED) && (
                                  <DropdownMenuItem 
                                    onClick={() => toggleCampaignStatus(campaign.id, campaign.status)}
                                  >
                                    {campaign.status === CampaignStatus.ACTIVE ? (
                                      <>
                                        <Pause className="mr-2 h-4 w-4" />
                                        Pause Campaign
                                      </>
                                    ) : (
                                      <>
                                        <Play className="mr-2 h-4 w-4" />
                                        Activate Campaign
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <a href={`/dashboard/projects/${projectId}/campaigns/${campaign.id}/duplicate`}>
                                    Duplicate
                                  </a>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center">
                  <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/60" />
                  <h3 className="mt-4 text-lg font-medium">No campaigns found</h3>
                  <p className="mt-2 text-muted-foreground">
                    {searchQuery 
                      ? `No campaigns match "${searchQuery}"`
                      : currentTab !== "all"
                        ? `You don't have any ${currentTab} campaigns`
                        : "Start by creating your first campaign"
                    }
                  </p>
                  <Button className="mt-4" asChild>
                    <a href={`/dashboard/projects/${projectId}/campaigns/new`}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Campaign
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {!loading && campaigns.length > 0 && (
            <div className="mt-4">
              <Pagination
                totalItems={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}