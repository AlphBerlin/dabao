"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { useUser } from "@/contexts/user-context";

export function useThemePreference() {
  const { setTheme } = useTheme();
  const { preferences } = useUser();
  
  // Sync theme from user preferences
  useEffect(() => {
    if (preferences?.theme) {
      setTheme(preferences.theme);
    }
  }, [preferences?.theme, setTheme]);
}
