"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AreaChart, 
  DonutChart,
  Title
} from "@tremor/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { fetchTelegramAnalytics } from "@/lib/api/telegram";
import {   
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle } from "@workspace/ui/components/card";
interface TelegramAnalyticsPanelProps {
  projectId: string;
}

export default function TelegramAnalyticsPanel({ projectId }: TelegramAnalyticsPanelProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["telegramAnalytics", projectId, period],
    queryFn: () => fetchTelegramAnalytics(projectId, period),
    refetchInterval: 60000 * 5, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-[180px]">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-12">No analytics data available</div>;
  }

  // Prepare data for the donut chart showing user status distribution
  const userStatusData = [
    { name: "Active", value: analytics.activeUsers },
    { name: "Subscribed", value: analytics.subscribedUsers - analytics.activeUsers },
    { name: "Unsubscribed", value: analytics.unsubscribedUsers }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Telegram Bot Analytics</h2>
        <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 hours</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
            <SelectItem value="year">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Users active in the last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.messagesSent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total messages sent by the bot
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Messages Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.messagesReceived}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total messages received from users
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth Over Time</CardTitle>
            <CardDescription>New users registering with your bot</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={analytics.userGrowth}
              index="date"
              categories={["count"]}
              colors={["indigo"]}
              yAxisWidth={40}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Activity</CardTitle>
            <CardDescription>Messages sent and received over time</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={analytics.messageActivity}
              index="date"
              categories={["sent", "received"]}
              colors={["cyan", "amber"]}
              yAxisWidth={40}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Status Distribution</CardTitle>
          <CardDescription>Breakdown of active, subscribed and unsubscribed users</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-full max-w-md">
            <DonutChart
              data={userStatusData}
              category="value"
              index="name"
              valueFormatter={(value) => `${value} users`}
              colors={["emerald", "indigo", "rose"]}
              className="h-80"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
