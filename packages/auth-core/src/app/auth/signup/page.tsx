"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthForm } from "@workspace/auth/components/auth/auth-form"
import { InputField } from "@workspace/auth/components/auth/input-field"
import { Button } from "@workspace/auth/components/ui/button"
import { ArrowRight, ArrowLeft, CheckCircle, Trophy, Star, Github } from "lucide-react"

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
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="absolute -top-2 -right-2 bg-amber-400 text-black font-bold rounded-full w-8 h-8 flex items-center justify-center"
              >
                +50
              </motion.div>
            </div>
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Account created!</h2>
          <p className="text-muted-foreground mb-3">You've earned the "New Explorer" badge!</p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center space-x-4 mt-6 mb-6"
          >
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="text-xs text-muted-foreground">First Login</p>
            </div>
            <div className="text-center">
              <Star className="w-8 h-8 mx-auto text-amber-400 mb-2" />
              <p className="text-xs text-muted-foreground">New Explorer</p>
            </div>
          </motion.div>
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
                <span className="text-xs font-medium">{xpPoints} XP</span>
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
                  {formState.name && formState.email && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -right-2 -top-2 bg-amber-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      +15
                    </motion.span>
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGoogleSignIn} 
                    className="flex items-center justify-center"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button type="button" variant="outline" className="flex items-center justify-center">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
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
                        {formState.password && formState.confirmPassword && formState.password === formState.confirmPassword && (
                          <motion.span 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -right-2 -top-2 bg-amber-400 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            +20
                          </motion.span>
                        )}
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