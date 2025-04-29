"use client"

import { motion } from "framer-motion"
import { cn } from "@workspace/ui/lib/utils"
import { Tag, Truck, Gift, Coffee, Ticket } from "lucide-react"

export function RewardsCategories() {
  const categories = [
    { icon: Tag, label: "Discounts", active: true },
    { icon: Truck, label: "Shipping" },
    { icon: Gift, label: "Products" },
    { icon: Coffee, label: "Experiences" },
    { icon: Ticket, label: "Events" },
  ]

  return (
    <div className="flex overflow-x-auto pb-2 hide-scrollbar">
      <div className="flex gap-3">
        {categories.map((category, index) => (
          <motion.div
            key={category.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-lg min-w-[80px] cursor-pointer",
              category.active ? "bg-accent-teal text-white" : "bg-gray-100 text-mid-gray hover:bg-gray-200",
            )}
          >
            <category.icon className="h-5 w-5 mb-1" />
            <span className="text-xs whitespace-nowrap">{category.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
