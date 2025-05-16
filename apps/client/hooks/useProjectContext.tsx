// React hook for accessing project context in client components
'use client';

import { useState, useEffect, createContext, useContext } from 'react';

// Define the project context type
interface ProjectContextType {
  projectId: string;
  projectSlug: string;
  domain: string;
  isLoading: boolean;
  error: string | null;
}

// Create a context with default values
const ProjectContext = createContext<ProjectContextType>({
  projectId: '',
  projectSlug: '',
  domain: '',
  isLoading: true,
  error: null,
});

/**
 * Provider component that wraps the app and provides project context
 */
export function ProjectContextProvider({ children }: { children: React.ReactNode }) {
  const [projectContext, setProjectContext] = useState<ProjectContextType>({
    projectId: '',
    projectSlug: '',
    domain: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function loadProjectContext() {
      try {
        // Fetch project context from API
        const response = await fetch('/api/context');
        
        if (!response.ok) {
          throw new Error('Failed to load project context');
        }
        
        const data = await response.json();
        
        setProjectContext({
          projectId: data.projectId,
          projectSlug: data.projectSlug,
          domain: data.domain,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading project context:', error);
        
        setProjectContext(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }
    
    loadProjectContext();
  }, []);

  return (
    <ProjectContext.Provider value={projectContext}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Hook for accessing project context in client components
 */
export function useProjectContext() {
  return useContext(ProjectContext);
}
