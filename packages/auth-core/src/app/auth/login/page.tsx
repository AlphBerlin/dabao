"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"

import { ArrowRight, CheckCircle, Github, Trophy } from "lucide-react"
import GoogleSignInButton from "@workspace/auth/components/auth/google-signin-button"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [formState, setFormState] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [showBadge, setShowBadge] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: Record<string, string> = {}

    if (!formState.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formState.password) {
      newErrors.password = "Password is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    setIsLoading(true)
    setLoginAttempts(prev => prev + 1)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success state
      setShowSuccess(true)
      setShowBadge(loginAttempts === 0)

      // Redirect after success animation
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      setErrors({
        form: "Invalid email or password. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    
    try {
      // Simulate Google sign-in API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Show success state
      setShowSuccess(true)
      setShowBadge(loginAttempts === 0)
      
      // Redirect after success animation
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      setErrors({
        form: "Google sign-in failed. Please try again.",
      })
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-background/90">
      {showSuccess ? (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2,
            }}
          >
            <div className="relative">
              <CheckCircle className="w-20 h-20 mx-auto text-primary mb-4" />
              {showBadge && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="absolute -top-2 -right-2 bg-amber-400 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center"
                >
                  +20
                </motion.div>
              )}
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </motion.div>
      ) : (
        <AuthForm 
          title="Welcome back" 
          subtitle="Enter your credentials to access your account"
          showConfetti={false}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.form && (
              <motion.div
                className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.form}
              </motion.div>
            )}

            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={formState.email}
              onChange={handleChange}
              error={errors.email}
            />

            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={formState.password}
              onChange={handleChange}
              error={errors.password}
            />

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full mt-6 relative group" 
              isLoading={isLoading}
            >
              {!isLoading && (
                <span className="flex items-center">
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <GoogleSignInButton/>
            </div>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </AuthForm>
      )}
    </div>
  )
}
