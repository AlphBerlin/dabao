import { Suspense } from 'react';
import { Metadata } from 'next';
import AiImagesPage from '@/components/ai-images/ai-images-page';
import AiImagesPageSkeleton from '@/components/ai-images/ai-images-page-skeleton';

export const metadata: Metadata = {
  title: 'AI Image Generation',
  description: 'Generate and manage AI-powered images for your project',
};

export default async function ImagesPage({ params }: { params: { projectId: string } }) {
  const { projectId } = await params;
  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Image Generation</h1>
        <p className="text-muted-foreground">
          Generate and manage AI-powered images for your project
        </p>
      </div>

      <Suspense fallback={<AiImagesPageSkeleton />}>
        <AiImagesPage projectId={projectId} />
      </Suspense>
    </div>
  );
}