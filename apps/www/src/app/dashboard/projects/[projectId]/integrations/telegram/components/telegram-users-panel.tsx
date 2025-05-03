"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Check,
  Search,
  XCircle,
  Calendar,
  Users,
  Download,
  UserCheck,
  UserX,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@workspace/ui/components/select";

interface TelegramUsersPanelProps {
  projectId: string;
}

// This would typically be fetched from the API
interface TelegramUser {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isSubscribed: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
  lastInteraction: string;
  hasLinkedCustomer: boolean;
}

export default function TelegramUsersPanel({ projectId }: TelegramUsersPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // In a real implementation, this would call an API endpoint
  // with search params and pagination
  const { data: users, isLoading } = useQuery({
    queryKey: ["telegramUsers", projectId, search, filter],
    queryFn: () => fetchTelegramUsers(projectId, search, filter),
    // Mock data for demonstration
    placeholderData: mockTelegramUsers,
    staleTime: 60000, // 1 minute
  });

  const totalUsers = users?.length || 0;
  const subscribedUsers = users?.filter(u => u.isSubscribed).length || 0;
  const unsubscribedUsers = totalUsers - subscribedUsers;
  const linkedUsers = users?.filter(u => u.hasLinkedCustomer).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Telegram Users</h2>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              {isLoading ? <Skeleton className="h-8 w-12" /> : totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2 text-green-600">
              <UserCheck className="h-5 w-5" />
              {isLoading ? <Skeleton className="h-8 w-12" /> : subscribedUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unsubscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2 text-red-500">
              <UserX className="h-5 w-5" />
              {isLoading ? <Skeleton className="h-8 w-12" /> : unsubscribedUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Linked Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-2 text-blue-500">
              <Calendar className="h-5 w-5" />
              {isLoading ? <Skeleton className="h-8 w-12" /> : linkedUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            Manage users who have interacted with your Telegram bot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-grow relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={filter}
              onValueChange={setFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="subscribed">Subscribed Only</SelectItem>
                  <SelectItem value="unsubscribed">Unsubscribed Only</SelectItem>
                  <SelectItem value="linked">Linked to Customer</SelectItem>
                  <SelectItem value="unlinked">Not Linked</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Customer Link</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!users || users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {user.username ? `@${user.username}` : "No username"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isSubscribed ? (
                            <Badge variant="success" className="flex items-center gap-1 w-fit">
                              <Check className="h-3 w-3" />
                              Subscribed
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <XCircle className="h-3 w-3" />
                              Unsubscribed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.hasLinkedCustomer ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 w-fit">
                              Linked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="w-fit">
                              Not Linked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.lastInteraction).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Mock function to simulate API call
async function fetchTelegramUsers(
  projectId: string, 
  search: string, 
  filter: string
): Promise<TelegramUser[]> {
  // In a real implementation, this would call the API
  // This is just a placeholder
  console.log("Fetching users with", { projectId, search, filter });
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  let filteredUsers = [...mockTelegramUsers];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredUsers = filteredUsers.filter((user) => {
      return (
        (user.username && user.username.toLowerCase().includes(searchLower)) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower))
      );
    });
  }
  
  // Apply status filter
  if (filter !== 'all') {
    filteredUsers = filteredUsers.filter((user) => {
      if (filter === 'subscribed') return user.isSubscribed;
      if (filter === 'unsubscribed') return !user.isSubscribed;
      if (filter === 'linked') return user.hasLinkedCustomer;
      if (filter === 'unlinked') return !user.hasLinkedCustomer;
      return true;
    });
  }
  
  return filteredUsers;
}

// Mock data for demonstration
const mockTelegramUsers: TelegramUser[] = [
  {
    id: "1",
    username: "johndoe",
    firstName: "John",
    lastName: "Doe",
    isSubscribed: true,
    subscribedAt: "2023-01-15T10:30:00Z",
    unsubscribedAt: null,
    lastInteraction: "2023-05-01T14:22:00Z",
    hasLinkedCustomer: true,
  },
  {
    id: "2",
    username: "janedoe",
    firstName: "Jane",
    lastName: "Doe",
    isSubscribed: true,
    subscribedAt: "2023-02-10T08:15:00Z",
    unsubscribedAt: null,
    lastInteraction: "2023-05-02T09:45:00Z",
    hasLinkedCustomer: true,
  },
  {
    id: "3",
    username: "bobsmith",
    firstName: "Bob",
    lastName: "Smith",
    isSubscribed: false,
    subscribedAt: "2023-01-20T11:45:00Z",
    unsubscribedAt: "2023-04-15T16:30:00Z",
    lastInteraction: "2023-04-15T16:30:00Z",
    hasLinkedCustomer: false,
  },
  {
    id: "4",
    username: "alicewalker",
    firstName: "Alice",
    lastName: "Walker",
    isSubscribed: true,
    subscribedAt: "2023-03-05T14:20:00Z",
    unsubscribedAt: null,
    lastInteraction: "2023-05-01T18:10:00Z",
    hasLinkedCustomer: true,
  },
  {
    id: "5",
    username: null,
    firstName: "Michael",
    lastName: "Brown",
    isSubscribed: true,
    subscribedAt: "2023-04-10T09:00:00Z",
    unsubscribedAt: null,
    lastInteraction: "2023-04-28T11:35:00Z",
    hasLinkedCustomer: false,
  }
];

// Add custom type for success badge
declare module "@workspace/ui/components/badge" {
  interface BadgeVariants {
    success: string;
  }
}
