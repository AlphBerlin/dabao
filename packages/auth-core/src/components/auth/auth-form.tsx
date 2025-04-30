"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@workspace/ui/lib/utils"
import { ProgressBadge } from "./progress-badge"
import { ConfettiTrigger } from "./confetti-trigger"

type AuthFormProps = {
  children: React.ReactNode
  title: string
  subtitle?: string
  currentStep?: number
  totalSteps?: number
  showConfetti?: boolean
  onConfettiComplete?: () => void
  className?: string
}

export function AuthForm({
  children,
  title,
  subtitle,
  currentStep,
  totalSteps = 1,
  showConfetti = false,
  onConfettiComplete,
  className,
}: AuthFormProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])


  return (
    <motion.div
      className={cn("w-full max-w-md mx-auto p-6 rounded-xl shadow-lg bg-card", "sm:p-8 md:p-10", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >

      {/* Progress indicator */}
      {currentStep && totalSteps > 1 && (
        <ProgressBadge currentStep={currentStep} totalSteps={totalSteps} className="mb-6" />
      )}

      {/* Title */}
      <motion.h1
        className="text-2xl font-bold text-foreground mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {title}
      </motion.h1>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="text-muted-foreground mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {subtitle}
        </motion.p>
      )}

      {/* Form content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep || "default"}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Confetti effect */}
      <ConfettiTrigger isActive={showConfetti} onComplete={onConfettiComplete} />
    </motion.div>
  )
}
