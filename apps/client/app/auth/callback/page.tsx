"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Get parameters from URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const redirectTo = params.get('redirect') || '/';
    const authError = params.get('error');
    const errorDescription = params.get('error_description');
    
    // Handle auth errors from the callback
    if (authError) {
      console.error("Auth error:", authError, errorDescription);
      setError(errorDescription || "Authentication error");
      return;
    }
    
    // If no code provided, redirect to the intended destination
    if (!code) {
      window.location.href = redirectTo;
      return;
    }
    
    // Handle the authentication code
    try {
      // Use location hash to trigger Supabase's internal auth handling
      window.location.hash = `#code=${code}`;
      
      // After a short delay to allow the hash to be processed, redirect
      setTimeout(() => {
        console.log("Auth processed, redirecting to:", redirectTo);
        window.location.href = redirectTo;
      }, 1500);
    } catch (err: any) {
      console.error("Auth callback error:", err);
      setError(err.message || "Unknown authentication error");
    }
  }, []); // Empty dependency array - run once on mount
  
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        {!error ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-gray-500">Completing your authentication...</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center mb-4">Authentication Error</h1>
            <div className="p-4 border border-red-300 bg-red-50 text-red-900 rounded-md">
              {error}
            </div>
            <div className="mt-4 text-center">
              <button 
                onClick={() => window.location.href = '/auth/login'} 
                className="text-primary hover:underline"
              >
                Return to login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
