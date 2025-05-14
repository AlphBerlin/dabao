"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  emailNotifications: boolean;
  marketingEmails: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "en-US",
  emailNotifications: true,
  marketingEmails: true,
};

export function useUserPreferences() {
  const { setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences from the API
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/preferences");
      
      if (!response.ok) {
        throw new Error(`Error fetching preferences: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPreferences(data);
      
      // Apply theme from preferences
      if (data.theme) {
        setTheme(data.theme);
      }
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch user preferences:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  // Update user preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPreferences),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating preferences: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPreferences(prev => ({ ...prev, ...data }));
      
      // Apply theme if it was updated
      if (newPreferences.theme) {
        setTheme(newPreferences.theme);
      }
      
      setError(null);
      return true;
    } catch (err) {
      console.error("Failed to update user preferences:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  // Export user data
  const exportUserData = useCallback(async () => {
    try {
      // Redirect to the export endpoint which will trigger a download
      window.location.href = "/api/user/account/export";
      return true;
    } catch (err) {
      console.error("Failed to export user data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  // Delete user account
  const deleteAccount = useCallback(async () => {
    try {
      const response = await fetch("/api/user/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error deleting account: ${response.statusText}`);
      }
      
      // Account deleted successfully, redirect to home page
      window.location.href = "/";
      return true;
    } catch (err) {
      console.error("Failed to delete account:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  // Load preferences on component mount
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    exportUserData,
    deleteAccount,
    refreshPreferences: fetchPreferences,
  };
}
