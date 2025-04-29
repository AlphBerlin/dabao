"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

export function ProfileBadges() {
  const badges = [
    {
      id: 1,
      title: "First Purchase",
      description: "Made your first purchase",
      icon: "/placeholder.svg?height=40&width=40",
      isUnlocked: true,
      date: "Apr 15, 2023",
    },
    {
      id: 2,
      title: "Profile Completed",
      description: "Filled out your profile information",
      icon: "/placeholder.svg?height=40&width=40",
      isUnlocked: true,
      date: "Apr 16, 2023",
    },
    {
      id: 3,
      title: "Social Sharer",
      description: "Shared a product on social media",
      icon: "/placeholder.svg?height=40&width=40",
      isUnlocked: true,
      date: "May 2, 2023",
    },
    {
      id: 4,
      title: "Review Master",
      description: "Wrote 5 product reviews",
      icon: "/placeholder.svg?height=40&width=40",
      isUnlocked: false,
    },
    {
      id: 5,
      title: "Loyal Customer",
      description: "Made 10 purchases",
      icon: "/placeholder.svg?height=40&width=40",
      isUnlocked: false,
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
        <CardTitle className="text-tn-blue">My Badges</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {badges.map((badge) => (
            <motion.div
              key={badge.id}
              variants={itemVariants}
              whileHover={badge.isUnlocked ? { y: -5, scale: 1.05 } : {}}
              className={cn(
                "flex flex-col items-center text-center p-4 rounded-lg",
                badge.isUnlocked ? "bg-white border border-accent-teal/20" : "bg-gray-100 opacity-50",
              )}
            >
              <div className="relative h-16 w-16 mb-2">
                <img
                  src={badge.icon || "/placeholder.svg"}
                  alt={badge.title}
                  className={cn(
                    "h-full w-full object-contain rounded-full p-2",
                    badge.isUnlocked ? "bg-accent-teal/10" : "bg-gray-200",
                  )}
                />
              </div>

              <h3 className="font-medium text-sm text-tn-blue">{badge.title}</h3>
              <p className="text-xs text-mid-gray mt-1">{badge.description}</p>

              {badge.isUnlocked && badge.date && <p className="text-xs text-accent-teal mt-2">Earned {badge.date}</p>}

              {!badge.isUnlocked && <p className="text-xs text-mid-gray mt-2">Locked</p>}
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
