"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { toast } from "@workspace/ui/components/sonner";
import {
  createTemplate,
  fetchTemplateCategories,
  EmailTemplateType,
  EmailTemplate
} from "@/lib/api/email-templates";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  previewText: z.string().optional(),
  type: z.enum(["TRANSACTIONAL", "MARKETING", "NOTIFICATION", "CUSTOM"]),
  categoryId: z.string().optional(),
});

// Component props
interface CreateTemplateFormProps {
  projectId: string;
  onSuccess: (template: EmailTemplate) => void;
  onCancel: () => void;
}

export default function CreateTemplateForm({ projectId, onSuccess, onCancel }: CreateTemplateFormProps) {
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      description: "",
      previewText: "",
      type: "TRANSACTIONAL" as EmailTemplateType,
      categoryId: "NONE", // Changed from undefined to "NONE"
    },
  });

  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
  } = useQuery({
    queryKey: ["emailTemplateCategories", projectId],
    queryFn: () => fetchTemplateCategories(projectId),
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      // Convert "NONE" back to undefined or empty string as needed by the API
      const payload = {
        ...data,
        categoryId: data.categoryId === "NONE" ? undefined : data.categoryId,
      };
      return createTemplate(projectId, payload);
    },
    onSuccess: (template) => {
      onSuccess(template);
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Submit handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Welcome Email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Subject</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Welcome to our platform!" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A brief description of this template"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                This helps your team understand when to use this template.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="previewText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preview Text (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Text shown in email clients before opening"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                This text appears in the inbox preview of many email clients.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    className="grid grid-cols-2 gap-2"
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="TRANSACTIONAL" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Transactional
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="MARKETING" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Marketing
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="NOTIFICATION" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Notification
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="CUSTOM" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Custom
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category (Optional)</FormLabel>
                <Select
                  disabled={categoriesLoading}
                  onValueChange={field.onChange}
                  value={field.value || "NONE"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {categoriesLoading ? "Loading categories..." : "Organize this template into a category."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
              'Create Template'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}