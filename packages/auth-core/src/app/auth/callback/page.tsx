"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "../../../lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const next = searchParams.get("next") || "/dashboard"
    const redirect = searchParams.get("redirect") || "/dashboard"

    const handleAuthCallback = async () => {
      try {
        // Get the session to handle the OAuth callback or email verification
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        // If we have a session, redirect to the appropriate page
        if (data?.session) {
          // Use the next or redirect param, falling back to dashboard
          router.push(next || redirect)
        } else {
          // If there's no session, go to login
          router.push("/auth/login")
        }
      } catch (err: any) {
        console.error("Error in auth callback:", err)
        setError(err.message || "Authentication error. Please try again.")
        
        // On error, redirect back to login after a short delay
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {error ? (
        <div className="p-6 max-w-md rounded-xl shadow-lg bg-background border border-border">
          <h2 className="text-xl font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm">Redirecting you to the login page...</p>
        </div>
      ) : (
        <div className="p-6 max-w-md rounded-xl shadow-lg bg-background border border-border">
          <div className="flex justify-center mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">Authenticating</h2>
          <p className="text-center text-muted-foreground">Please wait while we complete your authentication...</p>
        </div>
      )}
    </div>
  )
}
