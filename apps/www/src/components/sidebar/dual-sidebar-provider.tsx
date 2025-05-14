"use client";

import * as React from "react";
import { Button } from "@workspace/ui/components/button";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";

// Create a context to manage multiple independent sidebars
type SidebarStateMap = {
  [key: string]: boolean;
};

type MultiSidebarContextProps = {
  sidebarStates: SidebarStateMap;
  toggleSidebar: (id: string) => void;
  isMobile: boolean;
};

const MultiSidebarContext = React.createContext<MultiSidebarContextProps | null>(null);

export function useMultiSidebar() {
  const context = React.useContext(MultiSidebarContext);
  if (!context) {
    throw new Error("useMultiSidebar must be used within a DualSidebarProvider");
  }
  return context;
}

interface DualSidebarProviderProps {
  children: React.ReactNode;
  className?: string;
}

export function     DualSidebarProvider({ children, className }: DualSidebarProviderProps) {
  // Initialize both sidebars with their default states
  // Project sidebar starts open, app sidebar starts closed
  const [sidebarStates, setSidebarStates] = React.useState<SidebarStateMap>({
    "project-sidebar": true,
    "app-sidebar": false
  });

  const isMobile = useIsMobile();

  // Function to toggle a specific sidebar by ID
  const toggleSidebar = React.useCallback((id: string) => {
    setSidebarStates(prev => ({
      ...prev,
      [id]: !prev[id]
    }));

    // Store the state in a cookie with the sidebar ID to persist state
    if (typeof document !== "undefined") {
      const cookieName = `sidebar_state_${id}`;
      document.cookie = `${cookieName}=${!sidebarStates[id]}; path=/; max-age=${60 * 60 * 24 * 7}`;
    }
  }, [sidebarStates]);

  // Effect to handle keyboard shortcut if needed
  // React.useEffect(() => {
  //   // You could implement keyboard shortcuts here if needed
  // }, [toggleSidebar]);

  // Create context value
  const contextValue = React.useMemo<MultiSidebarContextProps>(() => ({
    sidebarStates,
    toggleSidebar,
    isMobile
  }), [sidebarStates, toggleSidebar, isMobile]);

  return (
    <MultiSidebarContext.Provider value={contextValue}>
      {children}
    </MultiSidebarContext.Provider>
  );
}

interface SidebarTriggerProps extends React.ComponentProps<"button"> {
  sidebarId: string;
  children: React.ReactNode;
  className?: string;
}

export function SidebarTriggerForSide({ 
  sidebarId, 
  children, 
  className = "", 
  ...props 
}: SidebarTriggerProps) {
  const { toggleSidebar } = useMultiSidebar();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleSidebar(sidebarId);
  };

  return (
    <Button
      variant="ghost" 
      size="icon"
      className={`size-7 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      <span className="sr-only">Toggle {sidebarId}</span>
    </Button>
  );
}
