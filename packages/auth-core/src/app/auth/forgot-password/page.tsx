"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"
import { ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

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
          <div className="text-center">
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

            <p className="text-muted-foreground mb-6">Didn't receive the email? Check your spam folder or try again.</p>

            <div className="flex flex-col gap-3">
              <Button variant="outline" size="lg" className="w-full" onClick={() => setIsSubmitted(false)}>
                Try again
              </Button>

              <Link href="/auth/login">
                <Button variant="ghost" size="lg" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                Send reset link
              </Button>

              <Link href="/auth/login">
                <Button type="button" variant="ghost" size="lg" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          </form>
        )}
      </AuthForm>
    </div>
  )
}
