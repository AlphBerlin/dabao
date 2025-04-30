"use client"

import { motion } from "framer-motion"
import { cn } from "@workspace/ui/lib/utils"

type ProgressBadgeProps = {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressBadge({ currentStep, totalSteps, className }: ProgressBadgeProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <motion.div
      className={cn("inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/20", className)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-16 h-2 bg-secondary/30 rounded-full mr-2 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span>
        Step {currentStep} of {totalSteps}
      </span>

      {/* Achievement stars based on progress */}
      <div className="ml-2 flex">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.span
            key={i}
            className={cn("text-xs", i < currentStep ? "text-yellow-400" : "text-gray-400")}
            initial={{ opacity: 0, rotate: -30 }}
            animate={{
              opacity: 1,
              rotate: i < currentStep ? [0, 20, 0] : 0,
              scale: i < currentStep ? [1, 1.3, 1] : 1,
            }}
            transition={{
              delay: i * 0.1,
              duration: 0.5,
              times: i < currentStep ? [0, 0.5, 1] : [0, 1],
            }}
          >
            ★
          </motion.span>
        ))}
      </div>
    </motion.div>
  )
}
