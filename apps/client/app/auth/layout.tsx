"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useProjectContext } from "@/hooks/useProjectContext";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const  project  = useProjectContext();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with back button */}
      <header className="py-4 px-6 flex items-center">
        <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
      </header>
      
      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Project branding if available */}
        {project && (
          <div className="mb-8 text-center">
            {project.logo ? (
              <img 
                src={project.logo} 
                alt={project.name} 
                className="h-12 mx-auto mb-2"
              />
            ) : (
              <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
            )}
          </div>
        )}
        
        {/* Auth form content */}
        {children}
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-muted-foreground">
        <div className="mb-2">
          <span className="flex items-center justify-center">
            Secured by <Check className="h-3 w-3 mx-1" /> Supabase Auth
          </span>
        </div>
        <div>
          &copy; {new Date().getFullYear()} {project?.name || 'Dabao'}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
