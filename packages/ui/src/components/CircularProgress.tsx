import type * as React from "react"
import { cn } from "@workspace/ui/lib/utils"

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
}

export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  className,
  ...props
}: CircularProgressProps) {
  const radius = size / 2 - strokeWidth / 2
  const circumference = 2 * Math.PI * radius
  const progress = ((value ?? 0) / max) * circumference

  return (
    <svg
      className={cn("radial-progress", className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      {...props}
    >
      <circle
        className="radial-progress-background"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeOpacity="0.5"
      />
      <circle
        className="radial-progress-indicator"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset: circumference - progress,
          transition: "stroke-dashoffset 0.3s ease 0s",
        }}
      />
    </svg>
  )
}
