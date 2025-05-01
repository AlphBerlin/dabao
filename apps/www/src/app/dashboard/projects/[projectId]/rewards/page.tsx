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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  MoreHorizontal, 
  Tag,
  Clock,
  Edit,
  Copy,
  Trash2,
  EyeOff,
  Eye,
  CalendarIcon,
  Award,
  Star,
  Gift,
  ArrowUpDown,
} from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { format } from "date-fns";

// Types
enum RewardType {
  POINTS = "POINTS",
  DISCOUNT = "DISCOUNT",
  FREEBIE = "FREEBIE",
  CASH_BACK = "CASH_BACK",
  TIER_UPGRADE = "TIER_UPGRADE",
  CUSTOM = "CUSTOM",
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  type: RewardType;
  value: number;
  code: string | null;
  active: boolean;
  image: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    customers: number;
    campaigns: number;
  };
}

interface ProjectDetails {
  pointsName?: string;
}

export default function RewardsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  
  // Parse search params
  const currentTab = searchParams.get("tab") || "active";
  const searchQuery = searchParams.get("search") || "";
  
  // State
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({});
  
  // Load rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const status = currentTab === "active" ? true : currentTab === "inactive" ? false : undefined;
        const url = `/api/projects/${projectId}/rewards?${status !== undefined ? `active=${status}&` : ""}${searchQuery ? `search=${searchQuery}` : ""}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to load rewards");
        }
        
        const data = await response.json();
        setRewards(data.rewards);
        if (data.project?.preferences) {
          setProjectDetails({
            pointsName: data.project.preferences.pointsName || "Points",
          });
        }
      } catch (error) {
        console.error("Error loading rewards:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRewards();
  }, [projectId, currentTab, searchQuery]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    
    router.push(`/dashboard/projects/${projectId}/rewards?${params.toString()}`);
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`/dashboard/projects/${projectId}/rewards?${params.toString()}`);
  };

  const toggleRewardStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/rewards/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update reward status");
      }
      
      // Update rewards locally
      setRewards(rewards.map(reward => 
        reward.id === id ? { ...reward, active: !currentStatus } : reward
      ));
      
    } catch (error) {
      console.error("Error updating reward status:", error);
    }
  };

  const getRewardTypeIcon = (type: RewardType) => {
    switch (type) {
      case RewardType.POINTS:
        return <Star className="h-4 w-4 text-blue-500" />;
      case RewardType.DISCOUNT:
        return <Tag className="h-4 w-4 text-green-500" />;
      case RewardType.FREEBIE:
        return <Gift className="h-4 w-4 text-purple-500" />;
      case RewardType.CASH_BACK:
        return <ArrowUpDown className="h-4 w-4 text-orange-500" />;
      case RewardType.TIER_UPGRADE:
        return <Award className="h-4 w-4 text-pink-500" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const formatRewardValue = (reward: Reward) => {
    const { type, value } = reward;
    const pointsName = projectDetails.pointsName || "Points";
    
    switch (type) {
      case RewardType.POINTS:
        return `${value} ${pointsName}`;
      case RewardType.DISCOUNT:
        return `${value}% off`;
      case RewardType.CASH_BACK:
        return `${value}% cashback`;
      case RewardType.FREEBIE:
        return "Free item";
      case RewardType.TIER_UPGRADE:
        return "Tier upgrade";
      default:
        return `${value} ${type.toLowerCase()}`;
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Rewards</h1>
          <p className="text-muted-foreground">
            Manage your loyalty program rewards
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button asChild>
            <a href={`/dashboard/projects/${projectId}/rewards/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Reward
            </a>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={currentTab} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSearch} className="relative max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search rewards..."
              className="pl-8 w-full md:w-[200px] lg:w-[280px]"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
        </div>
        
        <TabsContent value="active" className="mt-6">
          {renderRewards(true)}
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-6">
          {renderRewards(false)}
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          {renderRewards()}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  function renderRewards(activeStatus?: boolean) {
    let filteredRewards = rewards;
    
    if (activeStatus !== undefined) {
      filteredRewards = rewards.filter(reward => reward.active === activeStatus);
    }
    
    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-40 bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader className="p-4">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (filteredRewards.length === 0) {
      return (
        <div className="py-12 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">No rewards found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery 
              ? `No rewards match "${searchQuery}"`
              : activeStatus === true
                ? "You don't have any active rewards"
                : activeStatus === false
                  ? "You don't have any inactive rewards"
                  : "Start by creating your first reward"
            }
          </p>
          <Button className="mt-4" asChild>
            <a href={`/dashboard/projects/${projectId}/rewards/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Reward
            </a>
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRewards.map((reward) => (
          <Card key={reward.id} className="overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900 relative">
              {reward.image ? (
                <img 
                  src={reward.image} 
                  alt={reward.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
                    {getRewardTypeIcon(reward.type)}
                  </div>
                </div>
              )}
              {!reward.active && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  Inactive
                </Badge>
              )}
            </div>
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {reward.description || "No description"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Reward Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <a href={`/dashboard/projects/${projectId}/rewards/${reward.id}`}>
                        View Details
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`/dashboard/projects/${projectId}/rewards/${reward.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Reward
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleRewardStatus(reward.id, reward.active)}>
                      {reward.active ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href={`/dashboard/projects/${projectId}/rewards/${reward.id}/duplicate`}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3 mb-4">
                <Badge variant="outline" className="flex gap-1 items-center">
                  {getRewardTypeIcon(reward.type)}
                  {formatRewardValue(reward)}
                </Badge>
                
                {reward.code && (
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Tag className="h-3 w-3" />
                    {reward.code}
                  </Badge>
                )}
                
                {reward.expiresAt && (
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Clock className="h-3 w-3" />
                    {format(new Date(reward.expiresAt), "MMM d, yyyy")}
                  </Badge>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span>{reward._count?.customers || 0} customers</span>
                  <span>•</span>
                  <span>{reward._count?.campaigns || 0} campaigns</span>
                </div>
                <span>Created {format(new Date(reward.createdAt), "MMM d")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}