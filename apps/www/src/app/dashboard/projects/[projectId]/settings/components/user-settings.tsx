"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Badge } from "@workspace/ui/components/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Loader2, MoreHorizontal, UserPlus, AlertCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { getProjectUsers, inviteUser, updateUserRole, removeUserFromProject } from "@/lib/api/settings";

interface UserSettingsProps {
  projectId: string;
}

export function UserSettings({ projectId }: UserSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatar?: string;
  }[]>([]);
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoading(true);
        const data = await getProjectUsers(projectId);
        setUsers(data);
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error("Failed to load project users");
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [projectId]);

  const handleInviteUser = async () => {
    if (!inviteEmail) return;
    
    try {
      setIsSendingInvite(true);
      const newInvite = await inviteUser(projectId, { email: inviteEmail, role: inviteRole });
      
      setUsers([...users, {
        id: newInvite.id,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
      }]);
      
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch (error) {
      console.error("Failed to invite user:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setIsUpdating(true);
      await updateUserRole(projectId, userId, newRole);
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole } 
          : user
      ));
      
      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update user role");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return;
    }
    
    try {
      await removeUserFromProject(projectId, userId);
      setUsers(users.filter(user => user.id !== userId));
      toast.success(`${userName} has been removed from the project`);
    } catch (error) {
      console.error("Failed to remove user:", error);
      toast.error("Failed to remove user from project");
    }
  };

  const resendInvitation = async (email: string) => {
    try {
      await inviteUser(projectId, { email, role: users.find(u => u.email === email)?.role || "MEMBER" });
      toast.success(`Invitation resent to ${email}`);
    } catch (error) {
      console.error("Failed to resend invitation:", error);
      toast.error("Failed to resend invitation");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'destructive';
      case 'MEMBER':
        return 'secondary';
      case 'VIEWER':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage access and permissions for team members
              </CardDescription>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No team members yet
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {user.avatar ? (
                              <AvatarImage src={user.avatar} alt={user.name} />
                            ) : (
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-muted-foreground text-sm">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === "OWNER" ? (
                          <Badge variant={getRoleBadgeVariant(user.role)}>Owner</Badge>
                        ) : (
                          <Select
                            disabled={isUpdating || user.status === 'invited'}
                            defaultValue={user.role}
                            onValueChange={(value) => handleUpdateRole(user.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="VIEWER">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === "active" ? "default" : "secondary"}
                          className={
                            user.status === "active" ? "bg-green-500" : 
                            user.status === "invited" ? "bg-yellow-500" : ""
                          }
                        >
                          {user.status === "active" ? "Active" : "Invited"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.status === 'invited' && (
                              <DropdownMenuItem onClick={() => resendInvitation(user.email)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Resend Invitation
                              </DropdownMenuItem>
                            )}
                            {user.role !== 'OWNER' && (
                              <DropdownMenuItem 
                                onClick={() => handleRemoveUser(user.id, user.name)}
                                className="text-red-600"
                              >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Remove User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Invite a team member to collaborate on this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                {inviteRole === 'ADMIN' && 'Can manage all project settings and invite other users'}
                {inviteRole === 'MEMBER' && 'Can create and manage content but cannot modify project settings'}
                {inviteRole === 'VIEWER' && 'Can view content but cannot make changes'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleInviteUser}
              disabled={!inviteEmail || isSendingInvite}
            >
              {isSendingInvite ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}