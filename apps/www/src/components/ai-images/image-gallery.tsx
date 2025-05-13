'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Download, Loader2, MoreVertical, Copy, Trash2, Expand } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@workspace/ui/components/card';
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
import { getImageSignedUrl, downloadImage } from '@/lib/utils/supabase-images';

interface ImageGalleryProps {
  projectId: string;
  images: SavedAIImage[];
  loading?: boolean;
  onImageDeleted: (imageId: string) => void;
}

interface ImageWithUrl extends SavedAIImage {
  signedUrl?: string;
}

export function ImageGallery({ projectId, images, loading = false, onImageDeleted }: ImageGalleryProps) {
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageWithUrl | null>(null);
  const [imagesWithUrls, setImagesWithUrls] = useState<ImageWithUrl[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(true);

  // Load signed URLs for all images
  useEffect(() => {
    const loadSignedUrls = async () => {
      if (images.length === 0) {
        setImagesWithUrls([]);
        setLoadingUrls(false);
        return;
      }
      
      setLoadingUrls(true);
      
      try {
        const withUrls = await Promise.all(
          images.map(async (image) => {
            try {
              const signedUrl = await getImageSignedUrl(image.storageKey);
              return { ...image, signedUrl };
            } catch (error) {
              console.error(`Failed to get signed URL for image ${image.id}:`, error);
              return { ...image };
            }
          })
        );
        
        setImagesWithUrls(withUrls);
      } catch (error) {
        console.error('Error loading signed URLs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load some images. Please try again.',
          variant: 'destructive',
        });
        // Still set the images even if some failed
        setImagesWithUrls(images.map(img => ({ ...img })));
      } finally {
        setLoadingUrls(false);
      }
    };

    loadSignedUrls();
  }, [images]);

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

  // Handle image download using Supabase storage
  const handleDownload = async (image: SavedAIImage) => {
    try {
      const filename = `ai-image-${image.prompt.slice(0, 20).replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
      await downloadImage(image.storageKey, filename);
      
      toast({
        title: 'Download Started',
        description: 'Your image is being downloaded.',
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle preview image - get a fresh signed URL
  const handlePreviewImage = async (image: ImageWithUrl) => {
    try {
      // If we already have a signed URL that's fresh, use it
      if (image.signedUrl) {
        setPreviewImage(image);
        return;
      }
      
      // Otherwise get a fresh URL
      const signedUrl = await getImageSignedUrl(image.storageKey);
      setPreviewImage({ ...image, signedUrl });
    } catch (error) {
      console.error('Error getting preview URL:', error);
      toast({
        title: 'Preview Failed',
        description: 'Failed to load the image preview. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading || loadingUrls) {
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
        {imagesWithUrls.map((image) => (
          <Card key={image.id} className="overflow-hidden flex flex-col">
            <div 
              className="relative aspect-square cursor-pointer"
              onClick={() => handlePreviewImage(image)}
            >
              {image.signedUrl ? (
                <Image
                  src={image.signedUrl}
                  alt={image.prompt}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
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
                    <DropdownMenuItem onClick={() => handleDownload(image)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePreviewImage(image)}>
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
              {previewImage.signedUrl ? (
                <Image
                  src={previewImage.signedUrl}
                  alt={previewImage.prompt}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
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
                  onClick={() => handleDownload(previewImage)}
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