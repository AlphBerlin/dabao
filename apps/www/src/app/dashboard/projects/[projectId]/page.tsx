"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { 
  UsersRound, 
  Gift, 
  TrendingUp, 
  Calendar, 
  Award,
  ShoppingBag,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface ProjectStats {
  totalCustomers: number;
  customerGrowth: number;
  activeCustomers: number;
  totalRewards: number;
  redeemedRewards: number;
  totalPointsIssued: number;
  totalRewardValue: number;
  conversionRate: number;
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("7d");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // In a real application, fetch data from an API endpoint
        const response = await fetch(`/api/projects/${projectId}/stats?timeframe=${timeframe}`);
        
        if (!response.ok) {
          throw new Error("Failed to load project stats");
        }
        
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error("Error loading project stats:", error);
        // Use placeholder data for demonstration
        setStats({
          totalCustomers: 1254,
          customerGrowth: 12.5,
          activeCustomers: 867,
          totalRewards: 45,
          redeemedRewards: 342,
          totalPointsIssued: 254600,
          totalRewardValue: 12450,
          conversionRate: 23.4
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [projectId, timeframe]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Project Overview</h1>
        <Tabs defaultValue={timeframe} onValueChange={setTimeframe} className="w-[400px]">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Customers"
          value={stats?.totalCustomers}
          description={`${stats?.customerGrowth}% from previous period`}
          trend={stats?.customerGrowth && stats.customerGrowth > 0 ? "up" : "down"}
          icon={<UsersRound className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <StatsCard
          title="Active Customers"
          value={stats?.activeCustomers}
          description={`${stats?.activeCustomers && stats?.totalCustomers ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0}% of total customers`}
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <StatsCard
          title="Total Rewards"
          value={stats?.totalRewards}
          description={`${stats?.redeemedRewards} redeemed`}
          icon={<Gift className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
        <StatsCard
          title="Points Issued"
          value={stats?.totalPointsIssued?.toLocaleString()}
          description="Total loyalty points"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          loading={loading}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Customer Activity</CardTitle>
            <CardDescription>Daily active customers over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="text-muted-foreground text-sm">
                [Activity chart will be rendered here]
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest activity in your project</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New purchase</p>
                    <p className="text-muted-foreground">Customer #1234 made a purchase</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2m ago</div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Reward redemption</p>
                    <p className="text-muted-foreground">Customer #5678 redeemed Free Coffee</p>
                  </div>
                  <div className="text-xs text-muted-foreground">15m ago</div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UsersRound className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New customer</p>
                    <p className="text-muted-foreground">Customer #9012 joined the program</p>
                  </div>
                  <div className="text-xs text-muted-foreground">1h ago</div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CircleDollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Points awarded</p>
                    <p className="text-muted-foreground">Customer #3456 earned 500 points</p>
                  </div>
                  <div className="text-xs text-muted-foreground">2h ago</div>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Campaign started</p>
                    <p className="text-muted-foreground">Summer Promotion is now active</p>
                  </div>
                  <div className="text-xs text-muted-foreground">3h ago</div>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <Button variant="outline" size="sm">
          View All Actions
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Add Customer"
          description="Add a new customer to your loyalty program"
          icon={<UsersRound className="h-5 w-5" />}
          href={`/dashboard/projects/${projectId}/customers/new`}
        />
        <ActionCard
          title="Create Reward"
          description="Set up a new reward for your customers"
          icon={<Gift className="h-5 w-5" />}
          href={`/dashboard/projects/${projectId}/rewards/new`}
        />
        <ActionCard
          title="Launch Campaign"
          description="Start a new marketing campaign"
          icon={<TrendingUp className="h-5 w-5" />}
          href={`/dashboard/projects/${projectId}/campaigns/new`}
        />
        <ActionCard
          title="Schedule Event"
          description="Create a special event for your customers"
          icon={<Calendar className="h-5 w-5" />}
          href={`/dashboard/projects/${projectId}/events/new`}
        />
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value?: number | string;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down";
  loading?: boolean;
}

function StatsCard({ title, value, description, icon, trend, loading }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {trend && (
                <>
                  {trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                </>
              )}
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function ActionCard({ title, description, icon, href }: ActionCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-all cursor-pointer">
      <CardHeader>
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
          {icon}
        </div>
        <CardTitle className="text-md">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="ghost" size="sm" className="mt-2" asChild>
          <a href={href}>Get Started</a>
        </Button>
      </CardContent>
    </Card>
  );
}
