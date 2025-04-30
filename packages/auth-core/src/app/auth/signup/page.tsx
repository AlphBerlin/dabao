"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"
import { ArrowRight, ArrowLeft, CheckCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}

    if (!formState.name) {
      newErrors.name = "Name is required"
    }

    if (!formState.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return false
    }

    return true
  }

  const validateStep2 = () => {
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
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep2()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Show success animation with confetti
      setShowConfetti(true)
    } catch (error) {
      setErrors({
        form: "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfettiComplete = () => {
    // Redirect after confetti animation
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      {showConfetti ? (
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
            <CheckCircle className="w-16 h-16 mx-auto text-primary mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Account created!</h2>
          <p className="text-muted-foreground">You've earned the "New Explorer" badge!</p>
        </motion.div>
      ) : (
        <AuthForm
          title={currentStep === 1 ? "Create an account" : "Set your password"}
          subtitle={
            currentStep === 1
              ? "Join our community and unlock exclusive features"
              : "Choose a strong password to secure your account"
          }
          currentStep={currentStep}
          totalSteps={2}
          showConfetti={showConfetti}
          onConfettiComplete={handleConfettiComplete}
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

            {currentStep === 1 ? (
              <>
                <InputField
                  label="Full Name"
                  name="name"
                  placeholder="John Doe"
                  required
                  value={formState.name}
                  onChange={handleChange}
                  error={errors.name}
                />

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

                <Button type="button" variant="primary" size="lg" className="w-full mt-6" onClick={handleNext}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
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

                <div className="flex gap-4 mt-6">
                  <Button type="button" variant="outline" size="lg" className="flex-1" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>

                  <Button type="submit" variant="primary" size="lg" className="flex-1" isLoading={isLoading}>
                    {!isLoading && <CheckCircle className="ml-2 h-4 w-4" />}
                    Complete
                  </Button>
                </div>
              </>
            )}

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </AuthForm>
      )}
    </div>
  )
}
