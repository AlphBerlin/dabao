"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import { Badge } from "@workspace/ui/components/badge";
import {
  ChevronDown,
  Filter,
  Loader2,
  Mail,
  MailCheck,
  MoreVertical,
  PenSquare,
  Plus,
  Search,
  Trash,
  Settings2,
  FileText,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@workspace/ui/components/toast/use-toast";
import {
  useQuery,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { 
  fetchTemplates,
  fetchTemplateCategories,
  createTemplate,
  deleteTemplate,
  EmailTemplate,
  EmailTemplateType,
  EmailTemplateCategory,
  EmailTemplateStatus
} from "@/lib/api/email-templates";
import CreateTemplateForm from "./create-template-form";
import TemplateCategories from "./template-categories";

interface EmailTemplatesPageProps {
  projectId: string;
}

export default function EmailTemplatesPage({ projectId }: EmailTemplatesPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog/alert management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<EmailTemplateType | "">("");
  const [selectedStatus, setSelectedStatus] = useState<EmailTemplateStatus | "">("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [templateTabIndex, setTemplateTabIndex] = useState("all"); // 'all' or 'categories'

  // Queries
  const { 
    data: templates = [], 
    isLoading: templatesLoading,
    isError: templatesError,
  } = useQuery({
    queryKey: ["emailTemplates", projectId, selectedType, selectedStatus, selectedCategoryId],
    queryFn: () => fetchTemplates(projectId, {
      type: selectedType as EmailTemplateType | undefined,
      status: selectedStatus as EmailTemplateStatus | undefined,
      categoryId: selectedCategoryId || undefined,
    }),
  });

  const { 
    data: categories = [],
  } = useQuery({
    queryKey: ["emailTemplateCategories", projectId],
    queryFn: () => fetchTemplateCategories(projectId),
    enabled: templateTabIndex === "categories",
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!templateToDelete) throw new Error("No template selected for deletion");
      return deleteTemplate(projectId, templateToDelete.id);
    },
    onSuccess: () => {
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully."
      });
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    }
  });

  // Filter templates by search query
  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query)) ||
      template.subject.toLowerCase().includes(query)
    );
  });

  // Handle template creation
  const handleCreateSuccess = (template: EmailTemplate) => {
    setIsCreateDialogOpen(false);
    toast({
      title: "Template created",
      description: "Your new email template has been created successfully."
    });
    // Navigate to the newly created template
    router.push(`/dashboard/projects/${projectId}/integrations/smtp/templates/${template.id}`);
  };

  // Handle template deletion
  const handleDeleteTemplate = (template: EmailTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  // Confirm template deletion
  const confirmDeleteTemplate = () => {
    deleteMutation.mutate();
  };

  // Render status badge
  const renderStatusBadge = (status: EmailTemplateStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'PUBLISHED':
        return <Badge variant="default">Published</Badge>;
      case 'ARCHIVED':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return null;
    }
  };

  // Render type badge
  const renderTypeBadge = (type: EmailTemplateType) => {
    switch (type) {
      case 'TRANSACTIONAL':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Transactional</Badge>;
      case 'MARKETING':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Marketing</Badge>;
      case 'NOTIFICATION':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">Notification</Badge>;
      case 'CUSTOM':
        return <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">Custom</Badge>;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <>
      {/* Create template dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Create a new email template for your project.
            </DialogDescription>
          </DialogHeader>
          <CreateTemplateForm 
            projectId={projectId} 
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete template confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the template "{templateToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteTemplate}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={templateTabIndex} onValueChange={setTemplateTabIndex}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="categories">Manage Categories</TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
        
        <TabsContent value="all" className="mt-4 space-y-4">
          {/* Filters and search */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {selectedType ? selectedType : "All Types"}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="TRANSACTIONAL">Transactional</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="NOTIFICATION">Notification</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedStatus ? selectedStatus : "All Statuses"}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Templates list */}
          <Card>
            {templatesLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : templatesError ? (
              <div className="text-center py-16 text-destructive">
                <p>Error loading templates. Please try again.</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-16">
                {searchQuery || selectedType || selectedStatus || selectedCategoryId ? (
                  <div className="space-y-2">
                    <p>No templates match your filters</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedType("");
                        setSelectedStatus("");
                        setSelectedCategoryId("");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mx-auto bg-muted rounded-full w-16 h-16 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No email templates yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Create your first email template to start sending formatted emails to your users.
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Create Template
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/projects/${projectId}/integrations/smtp/templates/${template.id}`}
                            className="hover:underline text-primary font-medium"
                          >
                            {template.name}
                          </Link>
                        </TableCell>
                        <TableCell>{renderTypeBadge(template.type)}</TableCell>
                        <TableCell>{renderStatusBadge(template.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={template.subject}>
                          {template.subject}
                        </TableCell>
                        <TableCell>{template.category?.name || "-"}</TableCell>
                        <TableCell>{formatDate(template.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => router.push(`/dashboard/projects/${projectId}/integrations/smtp/templates/${template.id}`)}
                              >
                                <PenSquare className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/projects/${projectId}/integrations/smtp/templates/${template.id}/preview`)}
                              >
                                <MailCheck className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTemplate(template)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4">
          <TemplateCategories projectId={projectId} />
        </TabsContent>
      </Tabs>
    </>
  );
}