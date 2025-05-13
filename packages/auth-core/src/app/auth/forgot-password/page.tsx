"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"
import { ArrowLeft, Mail, Sparkles } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [achievementShown, setAchievementShown] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    if (!email) {
      setError("Email is required")
      return
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email")
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success state
      setIsSubmitted(true)
      
      // Show achievement notification after a delay
      setTimeout(() => {
        setAchievementShown(true)
      }, 1000)
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <AuthForm
        title={isSubmitted ? "Check your email" : "Forgot password"}
        subtitle={
          isSubmitted
            ? `We've sent a password reset link to ${email}`
            : "Enter your email and we'll send you a link to reset your password"
        }
      >
        {isSubmitted ? (
          <div className="text-center relative">
            <motion.div
              className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
            >
              <Mail className="h-8 w-8 text-primary" />
            </motion.div>

            {achievementShown && (
              <motion.div
                className="absolute -top-2 -right-2 bg-amber-400 text-black font-medium text-xs rounded-full px-2 py-1 flex items-center gap-1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Sparkles className="h-3 w-3" />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-muted-foreground mb-6">Didn't receive the email? Check your spam folder or try again.</p>

              <div className="flex flex-col gap-3">
                <Button variant="outline" size="lg" className="w-full" onClick={() => setIsSubmitted(false)}>
                  Try again
                </Button>

                <Link href="/auth/login">
                  <Button variant="ghost" size="lg" className="w-full group">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InputField
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={handleChange}
              error={error}
            />

            <div className="flex flex-col gap-3 mt-6">
              <Button type="submit" variant="primary" size="lg" className="w-full relative" isLoading={isLoading}>
                {!isLoading && (
                  <>
                    <span>Send reset link</span>
                    {email && !error && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-2 -top-2 bg-amber-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        +5
                      </motion.div>
                    )}
                  </>
                )}
              </Button>

              <Link href="/auth/login">
                <Button type="button" variant="ghost" size="lg" className="w-full group">
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to login
                </Button>
              </Link>
            </div>
          </motion.form>
        )}
        
        {!isSubmitted && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </AuthForm>
    </div>
  )
}
