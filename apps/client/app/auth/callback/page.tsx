"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleCallbackAndRedirect = async () => {
      const supabase = createClient();
      
      // Get the redirect URL from the query params or default to home
      const redirectTo = searchParams.get("redirect") || "/";
      
      // Get code and error from URL
      const code = searchParams.get("code");
      const authError = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      
      if (authError) {
        console.error("Auth error:", authError, errorDescription);
        setError(errorDescription || "Authentication error");
        return;
      }
      
      if (!code) {
        // No code in URL, nothing to exchange
        router.push(redirectTo);
        return;
      }
      
      try {
        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error("Code exchange error:", error);
          setError(error.message);
          return;
        }
        
        // Redirect to the intended destination
        router.push(redirectTo);
      } catch (err) {
        console.error("Callback handling error:", err);
        setError("Failed to process authentication");
      }
    };
    
    handleCallbackAndRedirect();
  }, [router, searchParams]);
  
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {error ? "Authentication Error" : "Completing Authentication"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8">
          {error ? (
            <Alert variant="destructive" className="w-full">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Please wait while we complete the authentication process...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
