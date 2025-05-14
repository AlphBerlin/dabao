"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Organization, User } from "@prisma/client";
import { UserPreferences } from "@/hooks/use-user-preferences";

// Define the user context interface
interface UserContextType {
  user: User | null;
  organizations: Organization[];
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<boolean>;
}

// Create default context with safe fallbacks
const defaultUserContext: UserContextType = {
  user: null,
  organizations: [],
  preferences: null,
  isLoading: false,
  error: null,
  setUser: () => {
    console.warn("UserProvider not initialized");
  },
  refreshUser: async () => {
    console.warn("UserProvider not initialized");
    return Promise.resolve();
  },
  updatePreferences: async () => {
    console.warn("UserProvider not initialized");
    return Promise.resolve(false);
  }
};

// Create the context with default value
const UserContext = createContext<UserContextType>(defaultUserContext);

// Provider props interface
interface UserProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
  initialOrganizations?: Organization[];
  initialPreferences?: UserPreferences | null;
}

/**
 * User context provider
 */
export function UserProvider({
  children,
  initialUser = null,
  initialOrganizations = [],
  initialPreferences = null,
}: UserProviderProps) {
  const [user, setUserState] = useState<User | null>(initialUser);
  const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations);
  const [preferences, setPreferences] = useState<UserPreferences | null>(initialPreferences);
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
      
      // Fetch user preferences
      await fetchUserPreferences();

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user data");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch user preferences
  const fetchUserPreferences = async () => {
    try {
      const response = await fetch("/api/user/preferences");
      
      if (response.ok) {
        const preferencesData = await response.json();
        setPreferences(preferencesData);
        return preferencesData;
      }
    } catch (err) {
      console.error("Failed to fetch user preferences:", err);
    }
    return null;
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

  // Update user preferences
  const updatePreferences = async (newPreferences: Partial<UserPreferences>): Promise<boolean> => {
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPreferences),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`);
      }
      
      const updatedPreferences = await response.json();
      setPreferences(prev => ({ ...prev, ...updatedPreferences }));
      return true;
    } catch (err) {
      console.error("Failed to update user preferences:", err);
      return false;
    }
  };

  // Create the context value object
  const contextValue = {
    user,
    organizations,
    preferences,
    isLoading,
    error,
    setUser,
    refreshUser,
    updatePreferences
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

/**
 * Custom hook to use the user context
 */
export function useUser() {
  const context = useContext(UserContext);
  
  // For development only: warn when used outside provider (but don't throw)
  if (process.env.NODE_ENV !== 'production' && context === defaultUserContext) {
    console.warn("useUser was used outside of UserProvider. Make sure the component is wrapped within a UserProvider.");
  }
  
  return context;
}