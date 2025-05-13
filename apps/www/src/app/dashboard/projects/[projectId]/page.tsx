"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
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
import {
  fetchProjectStats,
  fetchProjectEvents,
  fetchActivityChartData,
  type ProjectStats,
  type ProjectEvent,
  type ChartDataPoint,
  type TimeframeOption
} from "@/lib/api/project-overview";

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("7d");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const statsData = await fetchProjectStats(projectId, timeframe);
        setStats(statsData);
      } catch (error) {
        console.error("Error loading project stats:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        const chartData = await fetchActivityChartData(projectId, timeframe);
        setChartData(chartData);
      } catch (error) {
        console.error("Error loading chart data:", error);
      } finally {
        setChartLoading(false);
      }
    };
    
    fetchStats();
    fetchChartData();
  }, [projectId, timeframe]);
  
  // Fetch events only once, not on timeframe change
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        const eventsData = await fetchProjectEvents(projectId, 5);
        setEvents(eventsData);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setEventsLoading(false);
      }
    };
    
    fetchEvents();
  }, [projectId]);

  // Function to render activity chart
  const renderActivityChart = () => {
    if (chartLoading) {
      return <Skeleton className="h-full w-full" />;
    }
    
    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
          No activity data available
        </div>
      );
    }
    
    const maxValue = Math.max(...chartData.map(d => d.value));
    const chartHeight = 250;
    
    return (
      <div className="h-full w-full">
        <div className="flex h-[250px] items-end gap-2 pr-2 pl-2 pb-2">
          {chartData.map((dataPoint, idx) => {
            const height = dataPoint.value ? Math.max(15, (dataPoint.value / maxValue) * chartHeight) : 4;
            return (
              <div key={idx} className="relative flex flex-1 flex-col items-center">
                <div 
                  className="w-full bg-primary rounded-md transition-all duration-300" 
                  style={{ height: `${height}px` }}
                >
                  <div className="absolute bottom-[100%] left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap">
                    {dataPoint.value} customers
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 px-2 text-xs text-muted-foreground">
          {chartData.map((dataPoint, idx) => (
            <div key={idx} className={`${idx % 2 === 0 ? "block" : "hidden md:block"} text-center truncate`}>
              {dataPoint.displayDate}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Function to get icon based on event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'NEW_CUSTOMER':
        return <UsersRound className="h-4 w-4 text-primary" />;
      case 'POINTS':
        return <CircleDollarSign className="h-4 w-4 text-primary" />;
      case 'REWARD':
        return <Award className="h-4 w-4 text-primary" />;
      case 'ACTIVITY':
        return <ShoppingBag className="h-4 w-4 text-primary" />;
      case 'CAMPAIGN':
        return <Calendar className="h-4 w-4 text-primary" />;
      default:
        return <TrendingUp className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Project Overview</h1>
        <Tabs defaultValue={timeframe} onValueChange={(value) => setTimeframe(value as TimeframeOption)} className="w-[400px]">
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
            {renderActivityChart()}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest activity in your project</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : events.length > 0 ? (
              <ul className="space-y-4">
                {events.map((event, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{event.timeAgo}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent events found
              </div>
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
