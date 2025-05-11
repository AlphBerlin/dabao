'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Download, Loader2, MoreVertical, Copy, Trash2, Expand } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { toast } from '@workspace/ui/components/sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { SavedAIImage } from '@/lib/services/ai-image.service';
import { Badge } from '@workspace/ui/components/badge';
import { Skeleton } from '@workspace/ui/components/skeleton';

interface ImageGalleryProps {
  projectId: string;
  images: SavedAIImage[];
  loading?: boolean;
  onImageDeleted: (imageId: string) => void;
}

export function ImageGallery({ projectId, images, loading = false, onImageDeleted }: ImageGalleryProps) {
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<SavedAIImage | null>(null);

  // Handle image deletion
  const handleDeleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/images/${imageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
      
      onImageDeleted(imageId);
      toast({
        title: 'Image Deleted',
        description: 'The image has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingImageId(null);
      setDeleteLoading(false);
    }
  };

  // Handle copy prompt to clipboard
  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast({
      title: 'Prompt Copied',
      description: 'The image prompt has been copied to your clipboard.',
    });
  };

  // Handle image download
  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-image-${prompt.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AI Image Gallery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="relative aspect-square">
                <Skeleton className="h-full w-full absolute" />
              </div>
              <CardFooter className="p-3 flex-col items-start">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">AI Image Gallery</h2>
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <h3 className="text-xl font-semibold mb-2">No images yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate your first AI image using the form above.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">AI Image Gallery</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden flex flex-col">
            <div 
              className="relative aspect-square cursor-pointer"
              onClick={() => setPreviewImage(image)}
            >
              <Image
                src={image.imageUrl}
                alt={image.prompt}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>
            
            <CardContent className="p-3 flex-col items-start">
              <p className="text-sm font-medium line-clamp-2" title={image.prompt}>
                {image.prompt}
              </p>
              <div className="flex items-center justify-between w-full mt-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {image.provider}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(image.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopyPrompt(image.prompt)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload(image.imageUrl, image.prompt)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPreviewImage(image)}>
                      <Expand className="mr-2 h-4 w-4" />
                      View Larger
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deleteLoading && deletingImageId === image.id}
                      className="text-destructive focus:text-destructive"
                    >
                      {deleteLoading && deletingImageId === image.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete Image
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Image Preview Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="sm:max-w-[85vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {previewImage.prompt}
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative flex-1 min-h-[50vh]">
              <Image
                src={previewImage.imageUrl}
                alt={previewImage.prompt}
                fill
                className="object-contain"
              />
            </div>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {previewImage.provider}
                </Badge>
                {previewImage.size && (
                  <Badge variant="secondary">
                    {previewImage.size}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(previewImage.createdAt), 'PPP')}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleCopyPrompt(previewImage.prompt)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Prompt
                </Button>
                <Button 
                  onClick={() => handleDownload(previewImage.imageUrl, previewImage.prompt)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}