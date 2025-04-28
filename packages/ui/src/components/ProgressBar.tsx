"use client"

import type * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: "default" | "success" | "warning" | "error"
  size?: "default" | "sm"
  animated?: boolean
}

export function ProgressBar({
  value,
  max = 100,
  variant = "default",
  size = "default",
  animated = false,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max(0, (value / max) * 100), 100)

  const variantStyles = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  }

  const sizeStyles = {
    default: "h-2",
    sm: "h-1",
  }

  return (
    <div className={cn("w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden", className)} {...props}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          variantStyles[variant],
          sizeStyles[size],
          animated && "animate-pulse",
        )}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  )
}
