"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"
import { ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react"
import { resetPassword, getUser } from "@workspace/auth/lib/actions/auth"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formState, setFormState] = useState({
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if the user already has a valid reset token
    const checkUserAuth = async () => {
      const user = await getUser()
      setIsAuthenticated(!!user)
      setIsCheckingAuth(false)
    }
    
    checkUserAuth()
  }, [])

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

    if (!formState.password) {
      newErrors.password = "Password is required"
    } else if (formState.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (!formState.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formState.password !== formState.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const { error } = await resetPassword({
        password: formState.password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Show success state
      setIsSubmitted(true)

      // Redirect to login after a delay
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: any) {
      setErrors({
        form: error.message || "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated && !isCheckingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AuthForm title="Invalid Link" subtitle="This password reset link is invalid or has expired.">
          <div className="space-y-6">
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              The password reset link is invalid or has expired. Please request a new password reset link.
            </div>

            <div className="flex justify-center">
              <Link href="/auth/forgot-password">
                <Button variant="primary" size="lg">
                  Request New Link
                </Button>
              </Link>
            </div>
          </div>
        </AuthForm>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {isSubmitted ? (
        <motion.div
          className="text-center max-w-md"
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
            <CheckCircle className="w-20 h-20 mx-auto text-primary mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-4">Password Reset Successfully!</h2>
          <p className="text-muted-foreground mb-8">
            Your password has been reset successfully. You will be redirected to the login page shortly.
          </p>
          <Link href="/auth/login">
            <Button variant="outline" size="lg">
              Go to Login
            </Button>
          </Link>
        </motion.div>
      ) : (
        <AuthForm 
          title="Reset Password" 
          subtitle="Enter your new password below"
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

            <div className="mb-4 flex items-center justify-center">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>

            <InputField
              label="New Password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={formState.password}
              onChange={handleChange}
              error={errors.password}
            />

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              value={formState.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full mt-6" 
              isLoading={isLoading}
            >
              {!isLoading && "Reset Password"}
            </Button>

            <div className="text-center mt-6">
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </div>
          </form>
        </AuthForm>
      )}
    </div>
  )
}
