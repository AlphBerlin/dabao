"use client"

import { motion } from "framer-motion"
import { Gift, Lock } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export function RewardsGrid() {
  const rewards = [
    {
      id: 1,
      title: "10% Off Next Purchase",
      points: 500,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: true,
      isLocked: false,
      category: "Discounts",
    },
    {
      id: 2,
      title: "Free Standard Shipping",
      points: 300,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: false,
      category: "Shipping",
    },
    {
      id: 3,
      title: "Exclusive Member Gift",
      points: 1500,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: true,
      category: "Products",
    },
    {
      id: 4,
      title: "Early Access to Sales",
      points: 800,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: false,
      category: "Events",
    },
    {
      id: 5,
      title: "Free Coffee Voucher",
      points: 400,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: true,
      isLocked: false,
      category: "Experiences",
    },
    {
      id: 6,
      title: "15% Off Premium Items",
      points: 700,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: false,
      category: "Discounts",
    },
    {
      id: 7,
      title: "VIP Event Access",
      points: 1200,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: true,
      category: "Events",
    },
    {
      id: 8,
      title: "Express Shipping",
      points: 450,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: false,
      category: "Shipping",
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {rewards.map((reward) => (
        <motion.div
          key={reward.id}
          variants={itemVariants}
          whileHover={{ y: -5, transition: { type: "spring", stiffness: 300 } }}
          className={cn(
            "relative border rounded-lg p-4 flex flex-col items-center text-center transition-all hover:shadow-md bg-white",
            reward.isLocked && "opacity-70",
          )}
        >
          {reward.isPopular && (
            <Badge className="absolute -top-2 -right-2 bg-accent-teal hover:bg-accent-teal text-white">Popular</Badge>
          )}

          <div className="relative mb-3 h-20 w-20 flex items-center justify-center">
            <img src={reward.image || "/placeholder.svg"} alt={reward.title} className="h-full w-full object-contain" />
            {reward.isLocked && (
              <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                <Lock className="h-6 w-6 text-mid-gray" />
              </div>
            )}
          </div>

          <h3 className="font-medium text-sm text-tn-blue">{reward.title}</h3>
          <div className="mt-2 flex items-center justify-center text-sm font-medium text-mid-gray">
            <Gift className="h-3 w-3 mr-1 text-accent-teal" />
            {reward.points} pts
          </div>
          <div className="mt-1 text-xs text-mid-gray">{reward.category}</div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full mt-3">
            <Button
              variant={reward.isLocked ? "outline" : "default"}
              size="sm"
              className={cn("w-full", !reward.isLocked && "bg-accent-teal hover:bg-accent-teal/90 text-white")}
              disabled={reward.isLocked}
            >
              {reward.isLocked ? "Locked" : "Redeem"}
            </Button>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
