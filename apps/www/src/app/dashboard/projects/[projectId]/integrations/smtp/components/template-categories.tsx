"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@workspace/ui/components/sonner";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { Loader2, FolderPlus, Plus, Trash, Edit, ArrowRightLeft } from "lucide-react";
import { 
  createTemplateCategory,
  updateTemplateCategory,
  deleteTemplateCategory,
  fetchTemplateCategories,
  EmailTemplateCategory,
  CreateTemplateCategoryInput,
  UpdateTemplateCategoryInput
} from "@/lib/api/email-templates";

// Form schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

// Component props
interface TemplateCategoriesProps {
  projectId: string;
}

export default function TemplateCategories({ projectId }: TemplateCategoriesProps) {
  const queryClient = useQueryClient();
  
  // State for dialog management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<EmailTemplateCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<EmailTemplateCategory | null>(null);

  // Create form
  const createForm = useForm<z.infer<typeof createCategorySchema>>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Edit form
  const editForm = useForm<z.infer<typeof updateCategorySchema>>({
    resolver: zodResolver(updateCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["emailTemplateCategories", projectId],
    queryFn: () => fetchTemplateCategories(projectId),
  });

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTemplateCategoryInput) => createTemplateCategory(projectId, data),
    onSuccess: () => {
      toast.success("Email template category has been created successfully.");
      setIsCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["emailTemplateCategories", projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to create category: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: UpdateTemplateCategoryInput }) => 
      updateTemplateCategory(projectId, categoryId, data),
    onSuccess: () => {
      toast.success("Email template category has been updated successfully.");
      setIsEditDialogOpen(false);
      setCategoryToEdit(null);
      queryClient.invalidateQueries({ queryKey: ["emailTemplateCategories", projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to update category: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteTemplateCategory(projectId, categoryId),
    onSuccess: () => {
      toast.success("Email template category has been deleted successfully.");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["emailTemplateCategories", projectId] });
    },
    onError: (error) => {
      toast.error(`Failed to delete category: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Form handlers
  const onCreateSubmit = (data: z.infer<typeof createCategorySchema>) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof updateCategorySchema>) => {
    if (categoryToEdit) {
      updateMutation.mutate({ categoryId: categoryToEdit.id, data });
    }
  };

  // Open edit dialog and populate form
  const handleEditCategory = (category: EmailTemplateCategory) => {
    setCategoryToEdit(category);
    editForm.reset({
      name: category.name,
      description: category.description || "",
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDeleteCategory = (category: EmailTemplateCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      {/* Create category dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your email templates.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Transactional Emails" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of this category"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a short description to help identify this category.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    'Create Category'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit category dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template Category</DialogTitle>
            <DialogDescription>
              Update the details of this email template category.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a short description to help identify this category.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete category confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"?
              {categoryToDelete && categoryToDelete.templatesCount && (
                <p className="mt-2 text-destructive font-medium">
                  This category contains {categoryToDelete.templatesCount} template(s). 
                  You need to move or delete these templates before deleting the category.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete.id)}
              disabled={(deleteMutation.isPending || (categoryToDelete && categoryToDelete.templatesCount && categoryToDelete.templatesCount > 0)) as boolean}
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

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Template Categories</CardTitle>
              <CardDescription>
                Organize your email templates into categories for better management.
              </CardDescription>
            </div>
            <DialogTrigger asChild onClick={() => setIsCreateDialogOpen(true)}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
          </div>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categoriesError ? (
            <div className="text-center py-8 text-destructive">
              Error loading categories. Please try again.
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto bg-muted rounded-full w-12 h-12 flex items-center justify-center">
                <FolderPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">No categories yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first category to organize your email templates.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Create Category
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className="flex justify-between items-center p-3 rounded-md border hover:bg-accent/20"
                >
                  <div>
                    <div className="font-medium flex items-center">
                      {category.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {category.templatesCount || 0} template(s)
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={(category.templatesCount && category.templatesCount > 0) as boolean}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}