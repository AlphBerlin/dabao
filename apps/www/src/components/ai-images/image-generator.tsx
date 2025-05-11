'use client';

import { useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { toast } from '@workspace/ui/components/sonner';
import { SavedAIImage } from '@/lib/services/ai-image.service';

// Form validation schema
const formSchema = z.object({
  prompt: z.string().min(3, {
    message: 'Prompt must be at least 3 characters.',
  }).max(1000, {
    message: 'Prompt cannot exceed 1000 characters.',
  }),
  provider: z.enum(['openai', 'google', 'stability']).default('openai'),
  size: z.string().default('1024x1024'),
  style: z.string().default('vivid'),
  numberOfImages: z.coerce.number().int().min(1).max(4).default(1),
});

type FormValues = z.infer<typeof formSchema>;

// Default values for the form
const defaultValues: FormValues = {
  prompt: '',
  provider: 'openai',
  size: '1024x1024',
  style: 'vivid',
  numberOfImages: 1,
};

interface ImageGeneratorProps {
  projectId: string;
  onImagesGenerated: (images: SavedAIImage[]) => void;
}

export function ImageGenerator({ projectId, onImagesGenerated }: ImageGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Is the form being submitted?
  const isGenerating = isPending || isSubmitting;
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Submit the form
    startTransition(async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/images/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate images');
        }
        
        const data = await response.json();
        
        // Show success message
        toast({
          title: 'Images Generated!',
          description: `Successfully generated ${data.images.length} images`,
        });
        
        // Notify parent component about the new images
        onImagesGenerated(data.images);
        
        // Reset the form
        form.reset({ ...defaultValues, provider: values.provider });
      } catch (error) {
        console.error('Image generation error:', error);
        toast({
          title: 'Generation Failed',
          description: error instanceof Error ? error.message : 'Failed to generate images. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Generate Images</h2>
        <p className="text-muted-foreground">Create AI-generated images with a simple prompt</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Image Generation</CardTitle>
          <CardDescription>
            Use natural language to describe the image you want to create
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Prompt</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="A serene Japanese garden with cherry blossoms and a small pond" 
                        {...field} 
                        className="min-h-24 resize-y"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the image you want to generate in detail
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI DALL-E</SelectItem>
                          <SelectItem value="google">Google Imagen</SelectItem>
                          <SelectItem value="stability">Stability AI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1024x1024">1024×1024 (Square)</SelectItem>
                          <SelectItem value="1792x1024">1792×1024 (Landscape)</SelectItem>
                          <SelectItem value="1024x1792">1024×1792 (Portrait)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="numberOfImages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Images</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value.toString()}
                        disabled={isGenerating}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="How many images" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Image</SelectItem>
                          <SelectItem value="2">2 Images</SelectItem>
                          <SelectItem value="3">3 Images</SelectItem>
                          <SelectItem value="4">4 Images</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button type="submit" disabled={isGenerating}>
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? 'Generating...' : 'Generate Images'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}