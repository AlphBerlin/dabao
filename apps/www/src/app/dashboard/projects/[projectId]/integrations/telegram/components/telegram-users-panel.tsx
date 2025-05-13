"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@workspace/ui/components/avatar";
import {
  Check,
  Search,
  XCircle,
  Calendar,
  Users,
  Download,
  UserCheck,
  UserX,
  Send,
  Image as ImageIcon,
  Smile,
  X,
  MessageSquare,
  ArrowLeft,
  Paperclip,
  LoaderCircle,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";

interface TelegramUsersPanelProps {
  projectId: string;
}

// Updated to match API response structure
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
  photoUrl?: string | null;
  lastMessage?: {
    content: string;
    sentAt: string;
    isRead: boolean;
  } | null;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  isFromBot: boolean;
  timestamp: string;
  mediaUrl?: string;
}

// Interface for the profile photo cache
interface ProfilePhotoCache {
  [userId: string]: {
    photoUrl: string | null;
    timestamp: number;
  };
}

// Cache profile photos in memory (lasts until page refresh)
const photoCache: ProfilePhotoCache = {};
const PHOTO_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// API functions for real data
async function fetchTelegramUsers(
  projectId: string, 
  search: string, 
  filter: string
): Promise<TelegramUser[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filter !== "all") params.append("filter", filter);
    
    const response = await fetch(`/api/projects/${projectId}/integrations/telegram/users?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error) {
    console.error("Error fetching telegram users:", error);
    // Fallback to mock data in case API is not ready
    return mockTelegramUsers;
  }
}

async function fetchUserProfilePhoto(
  projectId: string,
  userId: string
): Promise<string | null> {
  // Check cache first
  if (photoCache[userId] && (Date.now() - photoCache[userId].timestamp) < PHOTO_CACHE_TTL) {
    return photoCache[userId].photoUrl;
  }
  
  try {
    const response = await fetch(
      `/api/projects/${projectId}/integrations/telegram/users/photo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching photo: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache the result (even if null)
    photoCache[userId] = {
      photoUrl: data.photoUrl,
      timestamp: Date.now()
    };
    
    return data.photoUrl;
  } catch (error) {
    console.error("Error fetching user photo:", error);
    
    // Cache the error result too to prevent repeated failed requests
    photoCache[userId] = {
      photoUrl: null,
      timestamp: Date.now()
    };
    
    return null;
  }
}

async function fetchMessages(
  projectId: string,
  userId: string,
  limit = 50
): Promise<Message[]> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/integrations/telegram/users/${userId}/messages?limit=${limit}`
    );
    if (!response.ok) throw new Error("Failed to fetch messages");
    return await response.json();
  } catch (error) {
    console.error("Error fetching messages:", error);
    // Fallback to mock messages
    return mockMessages.filter(m => m.senderId === userId || (!m.isFromBot && m.senderId === 'bot'));
  }
}

async function sendMessage(
  projectId: string,
  userId: string,
  text: string
): Promise<Message> {
  try {
    const response = await fetch(
      `/api/projects/${projectId}/integrations/telegram/users/${userId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );
    if (!response.ok) throw new Error("Failed to send message");
    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    // Mock response
    return {
      id: `msg-${Date.now()}`,
      text,
      senderId: 'bot',
      isFromBot: true,
      timestamp: new Date().toISOString(),
    };
  }
}

export default function TelegramUsersPanel({ projectId }: TelegramUsersPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<TelegramUser | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [photoFetchQueue, setPhotoFetchQueue] = useState<string[]>([]);
  const [usersWithLoadingPhotos, setUsersWithLoadingPhotos] = useState<Set<string>>(new Set());
  
  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  // Implement debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  // Query to fetch users with optimized parameters
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["telegramUsers", projectId, debouncedSearch, filter],
    queryFn: () => fetchTelegramUsers(projectId, debouncedSearch, filter),
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Query to fetch messages for selected user
  const { 
    data: messages = [], 
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["telegramMessages", projectId, selectedUser?.id],
    queryFn: () => fetchMessages(projectId, selectedUser?.id || ""),
    enabled: !!selectedUser && showChat,
    refetchInterval: showChat ? 5000 : false, // Poll for new messages every 5 seconds when chat is open
    refetchOnWindowFocus: false,
  });

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: (text: string) => sendMessage(projectId, selectedUser?.id || "", text),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ["telegramMessages", projectId, selectedUser?.id],
        (oldMessages: Message[] = []) => [...oldMessages, newMessage]
      );
      setMessageText("");
    },
  });

  // Optimized photo fetching with batching
  useEffect(() => {
    const fetchNextPhoto = async () => {
      if (photoFetchQueue.length === 0) return;
      
      // Take the first user from queue
      const userId = photoFetchQueue[0];
      if (usersWithLoadingPhotos.has(userId)) return;
      
      setUsersWithLoadingPhotos(prev => new Set([...prev, userId]));
      try {
        const photoUrl = await fetchUserProfilePhoto(projectId, userId);
        if (photoUrl) {
          // Update the user in the cache with the photo URL
          queryClient.setQueryData(
            ["telegramUsers", projectId, debouncedSearch, filter],
            (oldUsers: TelegramUser[] = []) => 
              oldUsers.map(u => 
                u.id === userId ? { ...u, photoUrl } : u
              )
          );
        }
      } catch (error) {
        console.error(`Error fetching photo for user ${userId}:`, error);
      } finally {
        // Remove from queue and loading set
        setPhotoFetchQueue(prev => prev.filter(id => id !== userId));
        setUsersWithLoadingPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    };
    
    fetchNextPhoto();
    
    // Set up a timer to process the queue every 500ms
    const timer = setInterval(fetchNextPhoto, 500);
    
    return () => clearInterval(timer);
  }, [photoFetchQueue, usersWithLoadingPhotos, projectId, queryClient, debouncedSearch, filter]);

  // Queue users for photo fetching when they first appear
  useEffect(() => {
    if (users && users.length > 0) {
      // Find users that need photo fetching and aren't already in the queue
      const usersToFetch = users
        .filter(user => !user.photoUrl && !photoCache[user.id] && !usersWithLoadingPhotos.has(user.id))
        .map(user => user.id);
      
      if (usersToFetch.length > 0) {
        // Add them to the queue - prioritize visible users first
        setPhotoFetchQueue(prev => [...prev, ...usersToFetch]);
      }
    }
  }, [users, usersWithLoadingPhotos]);

  // Fetch selected user's photo with higher priority
  useEffect(() => {
    if (selectedUser && !selectedUser.photoUrl && !usersWithLoadingPhotos.has(selectedUser.id)) {
      // Move this user to the front of the queue
      setPhotoFetchQueue(prev => [selectedUser.id, ...prev.filter(id => id !== selectedUser.id)]);
    }
  }, [selectedUser, usersWithLoadingPhotos]);

  // Auto-scroll to bottom of message list when new messages arrive
  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const totalUsers = users?.length || 0;
  const subscribedUsers = users?.filter(u => u.isSubscribed).length || 0;
  const unsubscribedUsers = totalUsers - subscribedUsers;
  const linkedUsers = users?.filter(u => u.hasLinkedCustomer).length || 0;

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;
    sendMessageMutation.mutate(messageText);
  };

  const handleOpenChat = (user: TelegramUser) => {
    setSelectedUser(user);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };

  // Function to get initials for avatar
  const getUserInitials = (user: TelegramUser) => {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Check if a user's photo is loading
  const isUserPhotoLoading = (userId: string) => {
    return usersWithLoadingPhotos.has(userId);
  };

  return (
    <div className="space-y-6 relative">
      {/* Main panel content */}
      <div className={`transition-all duration-300 ${showChat ? 'hidden md:block md:opacity-50' : ''}`}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Telegram Users</h2>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
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

        <Card className="mt-6">
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
                            <div className="flex items-center gap-3">
                              <Avatar className="relative">
                                {isUserPhotoLoading(user.id) && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-full">
                                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                                  </div>
                                )}
                                {user.photoUrl ? (
                                  <AvatarImage src={user.photoUrl} alt={`${user.firstName} ${user.lastName}`} />
                                ) : null}
                                <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {user.username ? `@${user.username}` : "No username"}
                                </span>
                                {user.lastMessage && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {user.lastMessage.content}
                                  </span>
                                )}
                              </div>
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="mr-2"
                              onClick={() => handleOpenChat(user)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
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

      {/* Chat panel (similar to LinkedIn messaging) */}
      {showChat && selectedUser && (
        <div className="fixed inset-0 md:absolute bg-white z-10 flex flex-col h-screen md:h-[calc(100vh-2rem)] md:inset-auto md:right-0 md:top-0 md:w-96 md:rounded-lg md:border md:shadow-lg">
          {/* Chat header */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden" 
                onClick={handleCloseChat}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 relative">
                {isUserPhotoLoading(selectedUser.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-full">
                    <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                {selectedUser.photoUrl ? (
                  <AvatarImage src={selectedUser.photoUrl} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                ) : null}
                <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser.username ? `@${selectedUser.username}` : "No username"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCloseChat} className="hidden md:flex">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoadingMessages ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`rounded-lg p-3 max-w-[80%] ${i % 2 === 0 ? 'bg-gray-100' : 'bg-blue-100'}`}>
                      <Skeleton className="h-4 w-[120px] mb-1" />
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground pt-10">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No messages yet.</p>
                <p className="text-sm">Send a message to start the conversation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromBot ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* User avatar for received messages */}
                    {!message.isFromBot && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        {selectedUser.photoUrl ? (
                          <AvatarImage src={selectedUser.photoUrl} alt={`${selectedUser.firstName}`} />
                        ) : null}
                        <AvatarFallback>{getUserInitials(selectedUser)}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`rounded-lg p-3 max-w-[80%] ${
                        message.isFromBot
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-gray-100'
                      }`}
                    >
                      {/* Show media if available */}
                      {message.mediaUrl && (
                        <div className="mb-2">
                          <img 
                            src={message.mediaUrl} 
                            alt="Media attachment" 
                            className="rounded max-w-full max-h-[200px]" 
                          />
                        </div>
                      )}
                      <p>{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messageEndRef} />
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="p-3 border-t bg-white">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px] resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className={sendMessageMutation.isPending ? 'animate-pulse' : ''}
                >
                  {sendMessageMutation.isPending ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ImageIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">Photo</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Paperclip className="h-4 w-4 mr-1" />
                <span className="text-xs">Attachment</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Smile className="h-4 w-4 mr-1" />
                <span className="text-xs">Emoji</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for fallback
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
    photoUrl: null,
    lastMessage: {
      content: "Thanks for the information!",
      sentAt: "2023-05-01T14:25:00Z",
      isRead: true
    }
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
    photoUrl: null,
    lastMessage: {
      content: "Hi, I have a question about your service",
      sentAt: "2023-05-02T09:40:00Z",
      isRead: true
    }
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
    photoUrl: null
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
    photoUrl: null
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
    photoUrl: null
  }
];

// Mock messages for fallback
const mockMessages: Message[] = [
  {
    id: "msg1",
    text: "Hello! How can I help you today?",
    senderId: "bot",
    isFromBot: true,
    timestamp: "2023-05-01T14:20:00Z",
  },
  {
    id: "msg2",
    text: "I'm interested in your products. Can you tell me more about your offerings?",
    senderId: "1",
    isFromBot: false,
    timestamp: "2023-05-01T14:22:00Z",
  },
  {
    id: "msg3",
    text: "Of course! We have a variety of products including...",
    senderId: "bot",
    isFromBot: true,
    timestamp: "2023-05-01T14:23:00Z",
  },
  {
    id: "msg4",
    text: "Thanks for the information!",
    senderId: "1",
    isFromBot: false,
    timestamp: "2023-05-01T14:25:00Z",
  },
  {
    id: "msg5",
    text: "Hi, I have a question about your service",
    senderId: "2",
    isFromBot: false,
    timestamp: "2023-05-02T09:40:00Z",
  },
  {
    id: "msg6",
    text: "Hello! I'd be happy to answer your questions. What would you like to know?",
    senderId: "bot",
    isFromBot: true,
    timestamp: "2023-05-02T09:42:00Z",
  },
];

// Add custom type for success badge
declare module "@workspace/ui/components/badge" {
  interface BadgeVariants {
    success: string;
  }
}
