"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"
import { ArrowRight, ArrowLeft, CheckCircle} from "lucide-react"
import GoogleSignInButton from "@workspace/auth/components/auth/google-signin-button"
import { signUp } from "@workspace/auth/lib/actions/auth"

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
  const [xpPoints, setXpPoints] = useState(0)

  // Gamified XP points animation when filling out the form
  useEffect(() => {
    if (formState.name) setXpPoints((prev) => Math.max(prev, 5))
    if (formState.email && /\S+@\S+\.\S+/.test(formState.email)) setXpPoints((prev) => Math.max(prev, 15))
    if (formState.password && formState.password.length >= 8) setXpPoints((prev) => Math.max(prev, 25))
    if (formState.confirmPassword && formState.password === formState.confirmPassword) setXpPoints((prev) => Math.max(prev, 35))
  }, [formState])

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
      const { data, error } = await signUp({
        email: formState.email,
        password: formState.password,
        redirectTo: `${window.location.origin}/dashboard`,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Show success animation with confetti
      setShowConfetti(true)
    } catch (error: any) {
      setErrors({
        form: error.message || "Something went wrong. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    
    try {
      // Simulate Google sign-in API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      // Show success and redirect
      setShowConfetti(true)
    } catch (error) {
      setErrors({
        form: "Google sign-in failed. Please try again.",
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background/95 to-background/90">
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
            <div className="relative">
              <CheckCircle className="w-20 h-20 mx-auto text-primary mb-4" />
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Account created!</h2>
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
          {xpPoints > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 relative bg-muted/50 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Profile completion</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(xpPoints/35) * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className="bg-primary h-2 rounded-full"
                />
              </div>
            </motion.div>
          )}

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

                <Button type="button" variant="primary" size="lg" className="w-full mt-8 relative group" onClick={handleNext}>
                  <span className="flex items-center">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
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

                <div className="mt-1 text-sm text-muted-foreground">
                  <p className="mb-1">Password strength:</p>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${
                        formState.password.length === 0 
                          ? 'w-0' 
                          : formState.password.length < 6 
                          ? 'w-1/4 bg-destructive' 
                          : formState.password.length < 8 
                          ? 'w-2/4 bg-amber-400' 
                          : formState.password.length < 10 
                          ? 'w-3/4 bg-green-500' 
                          : 'w-full bg-green-600'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button type="button" variant="outline" size="lg" className="flex-1 group" onClick={handleBack}>
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                  </Button>

                  <Button type="submit" variant="primary" size="lg" className="flex-1 relative group" isLoading={isLoading}>
                    {!isLoading && (
                      <>
                        <span className="flex items-center">
                          Complete
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </span>
                        
                      </>
                    )}
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