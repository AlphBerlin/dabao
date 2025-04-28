"use client"

import React from "react"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface Step {
  id: string
  title: string
  completed: boolean
  current?: boolean
}

interface ProgressBarProps {
  steps: Step[]
}

export function OnboardingProgressBar({ steps }: ProgressBarProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center 
                  ${
                    step.current
                      ? "bg-primary text-white"
                      : step.completed
                        ? "bg-green-500 text-white"
                        : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500"
                  }
                `}
                initial={{ scale: 0.8 }}
                animate={{ scale: step.current ? 1.1 : 1 }}
                transition={{ duration: 0.3, type: "spring" }}
              >
                {step.completed ? <Check size={18} /> : <span>{index + 1}</span>}
              </motion.div>
              <span
                className={`
                mt-2 text-sm font-medium
                ${step.current ? "text-primary" : step.completed ? "text-green-500" : "text-neutral-500"}
              `}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 relative">
                <div className="h-0.5 bg-neutral-200 dark:bg-neutral-700">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{ width: step.completed ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
