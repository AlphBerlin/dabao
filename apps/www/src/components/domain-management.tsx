// Domain management component for project settings
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { Badge } from '@workspace/ui/components/badge';
import { toast } from '@workspace/ui/components/sonner';
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
} from '@workspace/ui/components/alert-dialog';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Clipboard, Loader2, RefreshCw, Trash, Plus, ExternalLink } from 'lucide-react';

export default function DomainManagement({ projectId }: { projectId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [domains, setDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [newDomainData, setNewDomainData] = useState({
    domain: '',
    type: 'SUBDOMAIN',
    isPrimary: false
  });
  const [newClientData, setNewClientData] = useState({
    name: '',
    description: '',
    allowedIPs: '*',
  });

  // Load domains on component mount
  useEffect(() => {
    fetchDomains();
  }, [projectId]);

  // Fetch domains for the project
  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/domains`);
      if (!response.ok) throw new Error('Failed to fetch domains');
      
      const data = await response.json();
      setDomains(data.domains || []);
      
      // Select first domain by default if available
      if (data.domains && data.domains.length > 0) {
        setSelectedDomain(data.domains[0]);
        fetchClients(data.domains[0].id);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      toast.error('Error',{
        description: 'Failed to load domains',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch clients for a specific domain
  const fetchClients = async (domainId: string) => {
    if (!domainId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/domains/${domainId}/clients`);
      if (!response.ok) throw new Error('Failed to fetch clients');
      
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error',{
        description: 'Failed to load clients',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle domain selection change
  const handleDomainChange = (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (domain) {
      setSelectedDomain(domain);
      fetchClients(domainId);
    }
  };

  // Create a new domain
  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/domains`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDomainData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create domain');
      }
      
      const data = await response.json();
      
      toast.success('Success',{
        description: 'Domain created successfully',
      });
      
      // Reset form and refresh domains
      setNewDomainData({
        domain: '',
        type: 'SUBDOMAIN',
        isPrimary: false
      });
      
      fetchDomains();
    } catch (error: any) {
      console.error('Error creating domain:', error);
      toast.error('Error',{
        description: error.message || 'Failed to create domain',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a domain
  const handleDeleteDomain = async (domainId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/projects/${projectId}/domains?domainId=${domainId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete domain');
      }
      
      toast.success( 'Success',{
        description: 'Domain deleted successfully',
      });
      
      // Refresh domains
      fetchDomains();
      setSelectedDomain(null);
      setClients([]);
    } catch (error: any) {
      console.error('Error deleting domain:', error);
      toast.error('Error',{
        description: error.message || 'Failed to delete domain',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify a domain
  const handleVerifyDomain = async (domainId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/domains`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domainId, action: 'verify' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify domain');
      }
      
      const data = await response.json();
      
      toast.success('Success',{
        description: 'Domain verified successfully',
      });
      
      // Refresh domains
      fetchDomains();
    } catch (error: any) {
      console.error('Error verifying domain:', error);
      toast.error('Error',{
        description: error.message || 'Failed to verify domain',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new client for the selected domain
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/domains/${selectedDomain.id}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClientData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }
      
      const data = await response.json();
      
      toast.success('Success',{
        description: 'Client created successfully. Save the API key and secret securely!',
      });
      
      // Show the credentials in a modal or alert
      setNewClientCredentials({
        clientId: data.client.clientId,
        clientSecret: data.client.clientSecret,
        apiKey: data.client.apiKey,
      });
      
      // Reset form and refresh clients
      setNewClientData({
        name: '',
        description: '',
        allowedIPs: '*',
      });
      
      fetchClients(selectedDomain.id);
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error('Error',{
        description: error.message || 'Failed to create client',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a client
  const handleDeleteClient = async (clientId: string) => {
    if (!selectedDomain) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `/api/projects/${projectId}/domains/${selectedDomain.id}/clients?clientId=${clientId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete client');
      }
      
      toast.success('Success',{
        description: 'Client deleted successfully',
      });
      
      // Refresh clients
      fetchClients(selectedDomain.id);
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error('Error',{
        description: error.message || 'Failed to delete client',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle copying text to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!',{
      description: `${label} copied to clipboard`,
    });
  };

  // State for showing new client credentials
  const [newClientCredentials, setNewClientCredentials] = useState<{
    clientId: string;
    clientSecret: string;
    apiKey: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Domain Management</h2>
        <Button 
          onClick={() => fetchDomains()}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="domains">
        <TabsList>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Domain</CardTitle>
              <CardDescription>
                Configure a new domain or subdomain for your project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="new-domain-form" onSubmit={handleCreateDomain} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain-name">Domain Name</Label>
                    <Input
                      id="domain-name"
                      placeholder="Enter domain name"
                      value={newDomainData.domain}
                      onChange={(e) => setNewDomainData({...newDomainData, domain: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain-type">Domain Type</Label>
                    <Select 
                      value={newDomainData.type} 
                      onValueChange={(value) => setNewDomainData({...newDomainData, type: value})}
                    >
                      <SelectTrigger id="domain-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBDOMAIN">Subdomain</SelectItem>
                        <SelectItem value="CUSTOM_DOMAIN">Custom Domain</SelectItem>
                        <SelectItem value="ALIAS">Domain Alias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                form="new-domain-form"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Domains</CardTitle>
              <CardDescription>
                Manage domains associated with this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                        No domains registered
                      </TableCell>
                    </TableRow>
                  ) : (
                    domains.map((domain) => (
                      <TableRow key={domain.id}>
                        <TableCell>
                          <div className="font-medium">{domain.domain}</div>
                          {domain.isPrimary && (
                            <Badge className="ml-2" variant="outline">Primary</Badge>
                          )}
                        </TableCell>
                        <TableCell>{domain.type}</TableCell>
                        <TableCell>
                          {domain.isVerified ? (
                            <Badge variant="default">Verified</Badge>
                          ) : (
                            <Badge variant="outline">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!domain.isVerified && domain.type === 'CUSTOM_DOMAIN' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyDomain(domain.id)}
                                disabled={isLoading}
                              >
                                Verify
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Domain</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the domain "{domain.domain}"?
                                    This will also delete all associated clients.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteDomain(domain.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Domain</CardTitle>
              <CardDescription>
                Choose a domain to manage its clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedDomain?.id} 
                onValueChange={handleDomainChange}
                disabled={domains.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedDomain && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Add New Client</CardTitle>
                  <CardDescription>
                    Create a new client for domain: {selectedDomain.domain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="new-client-form" onSubmit={handleCreateClient} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-name">Client Name</Label>
                        <Input
                          id="client-name"
                          placeholder="Enter client name"
                          value={newClientData.name}
                          onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-description">Description (Optional)</Label>
                        <Input
                          id="client-description"
                          placeholder="Enter description"
                          value={newClientData.description}
                          onChange={(e) => setNewClientData({...newClientData, description: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowed-ips">Allowed IPs (comma-separated, * for any)</Label>
                      <Input
                        id="allowed-ips"
                        placeholder="*"
                        value={newClientData.allowedIPs}
                        onChange={(e) => setNewClientData({...newClientData, allowedIPs: e.target.value})}
                      />
                      <p className="text-sm text-gray-500">
                        Use * to allow from any IP, or specify IPs like 192.168.1.1, 10.0.0.1
                      </p>
                    </div>
                  </form>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    form="new-client-form"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Client
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Client List</CardTitle>
                  <CardDescription>
                    Manage clients for domain: {selectedDomain.domain}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Client ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Used</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            No clients for this domain
                          </TableCell>
                        </TableRow>
                      ) : (
                        clients.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell>
                              <div className="font-medium">{client.name}</div>
                              {client.description && (
                                <div className="text-sm text-gray-500">{client.description}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <code className="bg-gray-100 p-1 rounded text-xs">{client.clientId}</code>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyToClipboard(client.clientId, 'Client ID')}
                                >
                                  <Clipboard className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={client.status === 'ACTIVE' ? 'default' : 'outline'}
                              >
                                {client.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {client.lastUsedAt ? new Date(client.lastUsedAt).toLocaleString() : 'Never'}
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Client</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the client "{client.name}"?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteClient(client.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Alert dialog for displaying new client credentials */}
      {newClientCredentials && (
        <AlertDialog open={!!newClientCredentials} onOpenChange={() => setNewClientCredentials(null)}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Client Credentials</AlertDialogTitle>
              <AlertDialogDescription>
                <p className="text-red-600 font-bold mb-2">
                  IMPORTANT: Save these details now! They won't be shown again.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Client ID</Label>
                <div className="flex items-center">
                  <code className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto">
                    {newClientCredentials.clientId}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(newClientCredentials.clientId, 'Client ID')}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label>Client Secret</Label>
                <div className="flex items-center">
                  <code className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto">
                    {newClientCredentials.clientSecret}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(newClientCredentials.clientSecret, 'Client Secret')}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label>API Key</Label>
                <div className="flex items-center">
                  <code className="bg-gray-100 p-2 rounded text-sm flex-1 overflow-x-auto">
                    {newClientCredentials.apiKey}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(newClientCredentials.apiKey, 'API Key')}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction>I've saved these credentials</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
