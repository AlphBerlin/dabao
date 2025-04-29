"use client"

import { motion } from "framer-motion"
import { ArrowRight, Gift, Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

export function RewardsShowcase() {
  const rewards = [
    {
      id: 1,
      title: "10% Off Next Purchase",
      points: 500,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: true,
      isLocked: false,
    },
    {
      id: 2,
      title: "Free Standard Shipping",
      points: 300,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: false,
    },
    {
      id: 3,
      title: "Exclusive Member Gift",
      points: 1500,
      image: "/placeholder.svg?height=100&width=100",
      isPopular: false,
      isLocked: true,
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <Card className="border-none shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-tn-blue">Available Rewards</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-accent-teal" asChild>
            <Link href="/rewards">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
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
                "relative border rounded-lg p-4 flex flex-col items-center text-center transition-all hover:shadow-md",
                reward.isLocked && "opacity-70",
              )}
            >
              {reward.isPopular && (
                <Badge className="absolute -top-2 -right-2 bg-accent-teal hover:bg-accent-teal text-white">
                  Popular
                </Badge>
              )}

              <div className="relative mb-3 h-20 w-20 flex items-center justify-center">
                <img
                  src={reward.image || "/placeholder.svg"}
                  alt={reward.title}
                  className="h-full w-full object-contain"
                />
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
      </CardContent>
    </Card>
  )
}
