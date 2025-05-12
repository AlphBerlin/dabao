"use client";

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Create state to store the value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error("Error reading from localStorage", error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error("Error writing to localStorage", error);
    }
  };

  // Effect for syncing state with other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    // Handler to sync state with localStorage when changed in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          // Only update state if the value is different to avoid loops
          const newValue = JSON.parse(e.newValue);
          // Use functional update to guarantee we're working with the latest state
          setStoredValue(current => {
            // Only update if the value has actually changed to prevent loops
            const currentStr = JSON.stringify(current);
            const newStr = e.newValue;
            return currentStr !== newStr ? newValue : current;
          });
        } catch (error) {
          console.error("Error parsing storage change", error);
        }
      }
    };

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange);
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key]); // Only re-run effect if key changes

  return [storedValue, setValue] as const;
}