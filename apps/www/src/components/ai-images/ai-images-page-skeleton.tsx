import { Skeleton } from "@workspace/ui/components/skeleton";
import { Card } from "@workspace/ui/components/card";

export default function AiImagesPageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Generator form skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <Card className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <Skeleton className="h-10 w-32" />
        </Card>
      </div>
      
      {/* Gallery skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-56 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}