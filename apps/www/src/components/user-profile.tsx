"use client";

import { useState } from "react";
import { useUser } from "@/contexts/user-context";
import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Switch } from "@workspace/ui/components/switch";
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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Progress } from "@workspace/ui/components/progress";
import {
  User,
  Building,
  Mail,
  Calendar,
  Shield,
  Settings,
  Activity,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

export function UserProfile() {
  const { user, organizations, preferences, isLoading, error, refreshUser, updatePreferences } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Mock data for the profile page
  const mockStats = {
    memberSince: "Jan 15, 2023",
    lastActive: "Today",
    accountStatus: "Active",
    activityScore: 85,
    projectsCount: organizations?.length || 0,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Error</CardTitle>
          <CardDescription>Failed to load profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => refreshUser()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-600">
            Authentication Required
          </CardTitle>
          <CardDescription>
            You need to sign in to view your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-amber-500">
            Please sign in to access your personal profile and information.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleEditProfile = () => {
    if (isEditing) {
      // Save changes logic would go here
      // For now, we'll just toggle the state
      setIsEditing(false);
    } else {
      setEditedName(user.name || "");
      setIsEditing(true);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Profile Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="relative">
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Avatar className="h-24 w-24 border-2 border-primary">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <Badge className="absolute -bottom-2 -right-2 bg-primary text-white">
                  <Shield className="h-3 w-3 mr-1" /> Member
                </Badge>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <h2 className="text-2xl font-bold">{user.name || "User"}</h2>
                  <Badge variant="outline" className="w-fit mx-auto md:mx-0">
                    <Building className="h-3 w-3 mr-1" />{" "}
                    {organizations?.length || 0} Organization
                    {organizations?.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" /> Joined{" "}
                    {mockStats.memberSince}
                  </Badge>
                  <Badge variant="secondary">
                    <Activity className="h-3 w-3 mr-1" /> Last active{" "}
                    {mockStats.lastActive}
                  </Badge>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                    {mockStats.accountStatus}
                  </Badge>
                </div>
              </div>

              <Button onClick={handleEditProfile} className="shrink-0">
                {isEditing ? "Save" : "Edit Profile"}
              </Button>
            </div>

            {/* Profile Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-muted rounded-lg p-3 text-center"
              >
                <div className="text-2xl font-bold text-primary">
                  {organizations?.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Organizations
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-muted rounded-lg p-3 text-center"
              >
                <div className="text-2xl font-bold text-primary">
                  {mockStats.projectsCount}
                </div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-muted rounded-lg p-3 text-center"
              >
                <div className="text-2xl font-bold text-rimary">
                  {mockStats.activityScore}
                </div>
                <div className="text-xs text-muted-foreground">
                  Activity Score
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -5 }}
                className="bg-muted rounded-lg p-3 text-center"
              >
                <div className="text-2xl font-bold text-primary">100% </div>
                <div className="text-xs text-muted-foreground">
                  Profile Complete
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Content */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email || ""} disabled />
                    <p className="text-sm text-muted-foreground">
                      Contact support to change your email address
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Details about your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Name
                      </h3>
                      <p>{user.name || "Not provided"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Email
                      </h3>
                      <p>{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Member Since
                      </h3>
                      <p>{mockStats.memberSince}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Last Active
                      </h3>
                      <p>{mockStats.lastActive}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Profile Completion
                    </h3>
                    <Progress value={100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      Your profile is complete
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest account activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Profile updated</p>
                      <p className="text-xs text-muted-foreground">
                        Today at 10:30 AM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Building className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Joined new organization
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Yesterday at 4:15 PM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Account settings changed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        3 days ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Your Organizations</CardTitle>
                  <CardDescription>
                    Organizations you are a member of
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  New Organization
                </Button>
              </CardHeader>
              <CardContent>
                {organizations.length === 0 ? (
                  <div className="text-center py-6">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <h3 className="font-medium text-lg">No Organizations</h3>
                    <p className="text-muted-foreground text-sm">
                      You are not a member of any organizations yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {organizations.map((org) => (
                      <motion.div
                        key={org.id}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{org.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Member since {mockStats.memberSince}
                              </p>
                            </div>
                          </div>
                          {/* <Button variant="outline" size="sm">
                            View
                          </Button> */}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* <Card>
              <CardHeader>
                <CardTitle>Organization Metrics</CardTitle>
                <CardDescription>
                  Stats across your organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium">Projects</span>
                      <span>{mockStats.projectsCount}</span>
                    </div>
                    <Progress
                      value={mockStats.projectsCount * 10}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium">Team Members</span>
                      <span>{organizations.length * 3}</span>
                    </div>
                    <Progress
                      value={organizations.length * 30}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="font-medium">Activity Score</span>
                      <span>{mockStats.activityScore}%</span>
                    </div>
                    <Progress value={mockStats.activityScore} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme Preference</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div 
                      className={`border rounded-md p-3 hover:bg-muted cursor-pointer ${preferences?.theme === 'light' ? 'bg-muted' : ''}`}
                      onClick={() => updatePreferences({ theme: 'light' })}
                    >
                      <p className="font-medium text-sm">Light</p>
                    </div>
                    <div 
                      className={`border rounded-md p-3 hover:bg-muted cursor-pointer ${preferences?.theme === 'dark' ? 'bg-muted' : ''}`}
                      onClick={() => updatePreferences({ theme: 'dark' })}
                    >
                      <p className="font-medium text-sm">Dark</p>
                    </div>
                    <div 
                      className={`border rounded-md p-3 hover:bg-muted cursor-pointer ${preferences?.theme === 'system' ? 'bg-muted' : ''}`}
                      onClick={() => updatePreferences({ theme: 'system' })}
                    >
                      <p className="font-medium text-sm">System</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <div className="relative">
                    <select 
                      className="w-full h-10 px-3 py-2 bg-background border rounded-md appearance-none focus:ring-1 focus:ring-primary"
                      value={preferences?.language || 'en-US'}
                      onChange={(e) => updatePreferences({ language: e.target.value })}
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notifications" className="block mb-2">Email Preferences</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="emailNotifications" className="font-medium text-sm">Email Notifications</label>
                        <p className="text-xs text-muted-foreground">Receive notifications about your account</p>
                      </div>
                      <Switch 
                        id="emailNotifications"
                        checked={preferences?.emailNotifications}
                        onCheckedChange={(checked) => updatePreferences({ emailNotifications: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="marketingEmails" className="font-medium text-sm">Marketing Emails</label>
                        <p className="text-xs text-muted-foreground">Receive emails about new features and offers</p>
                      </div>
                      <Switch 
                        id="marketingEmails"
                        checked={preferences?.marketingEmails}
                        onCheckedChange={(checked) => updatePreferences({ marketingEmails: checked })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Download Your Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Get a copy of your personal data
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "/api/user/account/export"}
                  >
                    Export Data
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          account and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive hover:bg-destructive/90"
                          onClick={async () => {
                            try {
                              const response = await fetch("/api/user/account/delete", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" })
                              });
                              
                              if (response.ok) {
                                // Redirect to home page after successful deletion
                                window.location.href = "/";
                              } else {
                                alert("Failed to delete account. Please try again later.");
                              }
                            } catch (error) {
                              console.error("Error deleting account:", error);
                              alert("An error occurred while deleting your account.");
                            }
                          }}
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => refreshUser()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Profile Data
        </Button>
      </motion.div>
    </motion.div>
  );
}
