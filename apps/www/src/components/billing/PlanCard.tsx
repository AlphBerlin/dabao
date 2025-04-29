"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"

interface PricingPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  isPopular?: boolean
}

interface PlanCardProps {
  plan: PricingPlan
  isActive?: boolean
  onSelect?: (plan: PricingPlan) => void
}

export function PlanCard({ plan, isActive = false, onSelect }: PlanCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card
        className={`relative overflow-hidden ${
          plan.isPopular ? "border-2 border-primary" : "border border-neutral-200 dark:border-neutral-800"
        } ${isActive ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-neutral-900" : ""}`}
      >
        {plan.isPopular && (
          <div className="absolute top-0 right-0">
            <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl">Popular</div>
          </div>
        )}
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{plan.name}</h3>
          <div className="mt-2 mb-4">
            <span className="text-3xl font-bold">${plan.price}</span>
            <span className="text-neutral-500 dark:text-neutral-400">/month</span>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{plan.description}</p>
          <Button
            variant={plan.isPopular ? "default" : "outline"}
            className="w-full mb-4"
            onClick={() => onSelect?.(plan)}
          >
            {isActive ? "Current Plan" : "Select Plan"}
          </Button>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}
