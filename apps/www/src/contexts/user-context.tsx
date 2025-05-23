"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { setCookie, getCookie, deleteCookie } from "@/lib/utils/cookies";
import { useRouter } from "next/navigation";
import { Organization, User } from "@prisma/client";

// Define the user context interface
interface UserContextType {
  user: User | null;
  organizations: Organization[];
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

// Create default context with safe fallbacks
const defaultUserContext: UserContextType = {
  user: null,
  organizations: [],
  isLoading: false,
  error: null,
  setUser: () => {
    console.warn("UserProvider not initialized");
  },
  refreshUser: async () => {
    console.warn("UserProvider not initialized");
    return Promise.resolve();
  }
};

// Create the context with default value
const UserContext = createContext<UserContextType>(defaultUserContext);

// Provider props interface
interface UserProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialOrganizations?: Organization[];
}

/**
 * User context provider
 */
export function UserProvider({
  children,
  initialUser = null,
  initialOrganizations = [],
}: UserProviderProps) {
  const [user, setUserState] = useState<User | null>(initialUser);
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user data from the API
  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/context", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      
      // Extract user and organizations from API response
      if (data.user) {
        setUserState(data.user);
      }
      
      if (data.organizations) {
        setOrganizations(data.organizations);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user data");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data on mount
  useEffect(() => {
    if (!user) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Function to set the user
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  // Provide refresh function to force update of user data
  const refreshUser = async () => {
    return fetchUserData();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        organizations,
        isLoading,
        error,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to use the user context
 * @returns User context containing user data, organizations, and helper functions
 */
export function useUser() {
  const context = useContext(UserContext);
  
  // For development only: warn when used outside provider (but don't throw)
  if (process.env.NODE_ENV !== 'production' && context === defaultUserContext) {
    console.warn("useUser was used outside of UserProvider. Make sure the component is wrapped within a UserProvider.");
  }
  
  return context;
}