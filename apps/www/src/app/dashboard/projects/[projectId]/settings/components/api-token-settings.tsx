"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Copy, Eye, EyeOff, Key, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { getApiTokens, createApiToken, revokeApiToken, ApiToken } from "@/lib/api/settings";

interface ApiTokenSettingsProps {
  projectId: string;
}

export function ApiTokenSettings({ projectId }: ApiTokenSettingsProps) {
  const router = useRouter();
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTokenName, setNewTokenName] = useState("");
  const [newTokenType, setNewTokenType] = useState("Client");
  const [newTokenExpiryDays, setNewTokenExpiryDays] = useState("30");
  const [newTokenPermissions, setNewTokenPermissions] = useState<string[]>([]);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  
  const availablePermissions = [
    { id: "read:users", label: "Read Users" },
    { id: "write:users", label: "Write Users" },
    { id: "read:rewards", label: "Read Rewards" },
    { id: "write:rewards", label: "Write Rewards" },
    { id: "read:analytics", label: "Read Analytics" },
    { id: "admin", label: "Admin (Full Access)" },
  ];

  useEffect(() => {
    const fetchApiTokens = async () => {
      try {
        setIsLoading(true);
        const tokens = await getApiTokens(projectId);
        setApiTokens(tokens);
      } catch (error) {
        toast.error("Failed to fetch API tokens");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiTokens();
  }, [projectId]);

  const handleTogglePermission = (permission: string) => {
    setNewTokenPermissions(current => 
      current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission]
    );
  };

  const handleCreateToken = async () => {
    if (!newTokenName) return;
    
    setIsCreatingToken(true);
    try {
      const token = await createApiToken(projectId, {
        name: newTokenName,
        type: newTokenType,
        expiryDays: parseInt(newTokenExpiryDays, 10),
        permissions: newTokenPermissions,
      });
      
      setApiTokens([token, ...apiTokens]);
      setNewlyCreatedToken(token.token);
      setShowTokenDialog(true);
      
      // Reset form
      setNewTokenName("");
      setNewTokenType("Client");
      setNewTokenExpiryDays("30");
      setNewTokenPermissions([]);
    } catch (error) {
      toast.error("Failed to create API token");
      console.error(error);
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token)
      .then(() => {
        toast.success("Token copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy token");
      });
  };

  const handleToggleViewToken = (tokenId: string) => {
    setShowTokens(current => ({
      ...current,
      [tokenId]: !current[tokenId]
    }));
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token? This action cannot be undone.")) {
      return;
    }
    
    try {
      await revokeApiToken(projectId, tokenId);
      setApiTokens(current => current.filter(token => token.id !== tokenId));
      toast.success("API token revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke API token");
      console.error(error);
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
          <CardTitle>API Tokens</CardTitle>
          <CardDescription>Create and manage API tokens for accessing your project's data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Create New API Token</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input 
                        id="token-name" 
                        placeholder="e.g. Website Integration" 
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="token-type">Token Type</Label>
                      <Select
                        value={newTokenType}
                        onValueChange={setNewTokenType}
                      >
                        <SelectTrigger id="token-type">
                          <SelectValue placeholder="Select token type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Client">Client (Frontend)</SelectItem>
                          <SelectItem value="Server">Server (Backend)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="token-expiry">Expires In</Label>
                    <Select
                      value={newTokenExpiryDays}
                      onValueChange={setNewTokenExpiryDays}
                    >
                      <SelectTrigger id="token-expiry">
                        <SelectValue placeholder="Select expiration period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                        <SelectItem value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block mb-2">Permissions</Label>
                    <div className="space-y-2">
                      {availablePermissions.map((permission) => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`permission-${permission.id}`}
                            checked={newTokenPermissions.includes(permission.id)}
                            onCheckedChange={() => handleTogglePermission(permission.id)}
                          />
                          <Label 
                            htmlFor={`permission-${permission.id}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCreateToken} 
                  disabled={isCreatingToken || !newTokenName}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {isCreatingToken ? "Creating..." : "Create API Token"}
                </Button>
              </CardFooter>
            </Card>
            
            <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>API Token Created</DialogTitle>
                  <DialogDescription>
                    Make sure to copy your API token now. You won't be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{newlyCreatedToken}</code>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => newlyCreatedToken && handleCopyToken(newlyCreatedToken)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowTokenDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Your API Tokens</h3>
              
              {apiTokens.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No API tokens created yet
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiTokens.map((token) => (
                        <TableRow key={token.id}>
                          <TableCell className="font-medium">{token.name}</TableCell>
                          <TableCell>{token.type}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {token.permissions.map(permission => (
                                <Badge key={permission} variant="outline" className="text-xs">
                                  {permission}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {token.lastUsed 
                              ? format(parseISO(token.lastUsed), 'MMM d, yyyy') 
                              : 'Never used'}
                          </TableCell>
                          <TableCell>
                            {token.expiresAt
                              ? format(parseISO(token.expiresAt), 'MMM d, yyyy')
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={token.status === 'active' ? 'default' : 'secondary'}
                              className={token.status === 'active' ? 'bg-green-500' : ''}
                            >
                              {token.status === 'active' ? 'Active' : 'Expired'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {token.token && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleViewToken(token.id)}
                              >
                                {showTokens[token.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">
                                  {showTokens[token.id] ? 'Hide' : 'Show'} token
                                </span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeToken(token.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Revoke token</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}