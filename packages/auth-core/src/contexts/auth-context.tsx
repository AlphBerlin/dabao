"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { type User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Create a default context with safe fallbacks
const defaultAuthContext: AuthContextType = {
  user: null,
  loading: false,
  signIn: async () => { console.warn("Auth provider not initialized") },
  signOut: async () => { console.warn("Auth provider not initialized") }
}

const AuthContext = createContext<AuthContextType>(defaultAuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
      if (error) {
        console.error("Error fetching user:", error)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user)
        } else if (event === "SIGNED_OUT") {
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  // For development only: warn when used outside provider (but don't throw)
  if (process.env.NODE_ENV !== 'production' && context === defaultAuthContext) {
    console.warn("useAuth was used outside of AuthProvider. Make sure the component using this hook is wrapped within an AuthProvider.")
  }
  
  return context
}