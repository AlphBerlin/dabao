"use client";

import { useUser } from "@/contexts/user-context";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";

export function UserProfile() {
  const { user, organizations, isLoading, error, refreshUser } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 border border-red-300 rounded bg-red-50">
        <p>Error loading user data: {error}</p>
        <Button 
          variant="outline"
          className="mt-2" 
          onClick={() => refreshUser()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-gray-500 border border-gray-200 rounded">
        <p>Please sign in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        
        <div>
          <h1 className="text-2xl font-bold">{user.name || 'User'}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {organizations.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">Your Organizations</h2>
          <div className="space-y-2">
            {organizations.map((org) => (
              <div 
                key={org.id} 
                className="p-3 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-sm text-gray-500">{org.id}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button 
        onClick={() => refreshUser()}
        className="mt-4"
      >
        Refresh Data
      </Button>
    </div>
  );
}