"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Gift, ShoppingBag, Share2, Star } from "lucide-react"

export function ProfileHistory() {
  const activities = [
    {
      id: 1,
      type: "purchase",
      title: "Summer T-shirt Purchase",
      date: "May 15, 2023",
      points: "+150",
      icon: ShoppingBag,
    },
    {
      id: 2,
      type: "redeem",
      title: "Redeemed Free Shipping",
      date: "May 10, 2023",
      points: "-300",
      icon: Gift,
    },
    {
      id: 3,
      type: "share",
      title: "Shared Product on Social Media",
      date: "May 2, 2023",
      points: "+50",
      icon: Share2,
    },
    {
      id: 4,
      type: "review",
      title: "Wrote Product Review",
      date: "April 28, 2023",
      points: "+25",
      icon: Star,
    },
    {
      id: 5,
      type: "purchase",
      title: "First Purchase",
      date: "April 15, 2023",
      points: "+100",
      icon: ShoppingBag,
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
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
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
        <CardTitle className="text-tn-blue">Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="visible">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              variants={itemVariants}
              className="flex items-center gap-4 p-3 rounded-lg bg-white border border-gray-100 hover:shadow-sm"
            >
              <div
                className={`p-2 rounded-full ${
                  activity.type === "redeem" ? "bg-red-100 text-red-500" : "bg-accent-teal/10 text-accent-teal"
                }`}
              >
                <activity.icon className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-sm text-tn-blue">{activity.title}</h3>
                <p className="text-xs text-mid-gray">{activity.date}</p>
              </div>

              <div className={`font-medium ${activity.points.startsWith("+") ? "text-accent-teal" : "text-red-500"}`}>
                {activity.points}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
