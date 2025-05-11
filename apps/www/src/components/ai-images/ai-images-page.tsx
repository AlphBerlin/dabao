'use client';

import { useState, useEffect } from 'react';
import { ImageGenerator } from './image-generator';
import { ImageGallery } from './image-gallery';
import { SavedAIImage } from '@/lib/services/ai-image.service';
import { toast } from "@workspace/ui/components/sonner";

interface AiImagesPageProps {
  projectId: string;
}

export default function AiImagesPage({ projectId }: AiImagesPageProps) {
  const [images, setImages] = useState<SavedAIImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch images when the component mounts
  useEffect(() => {
    const fetchImages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/images`);
        if (!res.ok) {
          throw new Error('Failed to fetch images');
        }
        const data = await res.json();
        setImages(data.images || []);
      } catch (error) {
        console.error('Error loading images:', error);
        toast({
          title: 'Error',
          description: 'Failed to load images. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchImages();
  }, [projectId, toast]);

  // Handle new images being generated
  const handleImagesGenerated = (newImages: SavedAIImage[]) => {
    setImages(prevImages => [...newImages, ...prevImages]);
  };

  // Handle image deletion
  const handleImageDeleted = (imageId: string) => {
    setImages(prevImages => prevImages.filter(img => img.id !== imageId));
  };

  return (
    <div className="space-y-8">
      {/* Image Generator Form */}
      <ImageGenerator projectId={projectId} onImagesGenerated={handleImagesGenerated} />
      
      {/* Image Gallery */}
      <ImageGallery 
        projectId={projectId} 
        images={images} 
        loading={isLoading} 
        onImageDeleted={handleImageDeleted} 
      />
    </div>
  );
}