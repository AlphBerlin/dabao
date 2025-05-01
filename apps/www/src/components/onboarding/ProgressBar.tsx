'use client'

import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface Step {
  id: string
  title: string
  completed: boolean
  current: boolean
}

interface OnboardingProgressBarProps {
  steps: Step[]
}

export function OnboardingProgressBar({ steps }: OnboardingProgressBarProps) {
  const lastStepIndex = steps.length - 1
  
  return (
    <div className="w-full">
      <div className="flex justify-between">
        <div className="flex items-center w-full">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center relative z-10 ${step.current ? 'text-primary' : step.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                <div
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-full transition-colors
                    ${step.completed ? 'bg-primary text-primary-foreground' : step.current ? 'border-2 border-primary' : 'border border-muted-foreground bg-muted'}
                  `}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${step.current ? 'font-semibold' : ''}`}>
                  {step.title}
                </span>
              </div>
              {index < lastStepIndex && (
                <div 
                  className={`
                    flex-auto border-t-2 transition-colors duration-200 ease-in-out mx-2
                    ${index < steps.findIndex(s => s.current) ? 'border-primary' : 'border-muted'}
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
