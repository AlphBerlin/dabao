"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { Progress } from "@workspace/ui/components/progress"

export function ProfileStats() {
  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <motion.div whileHover={{ scale: 1.05 }} className="relative">
            <Avatar className="h-24 w-24 border-2 border-accent-teal">
              <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Jordan" />
              <AvatarFallback className="text-2xl bg-accent-teal text-white">JD</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-tn-blue text-white text-xs rounded-full px-2 py-1">
              Silver
            </div>
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-tn-blue">Jordan Doe</h2>
            <p className="text-mid-gray">Member since April 2023</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <motion.div whileHover={{ y: -5 }} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-tn-blue">1,250</div>
                <div className="text-xs text-mid-gray">Total Points</div>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-tn-blue">5</div>
                <div className="text-xs text-mid-gray">Badges Earned</div>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-tn-blue">3</div>
                <div className="text-xs text-mid-gray">Rewards Redeemed</div>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-tn-blue">12</div>
                <div className="text-xs text-mid-gray">Purchases</div>
              </motion.div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-tn-blue font-medium">Progress to Gold</span>
                <span className="text-mid-gray">1250 / 1500</span>
              </div>
              <Progress value={83} className="h-2 bg-gray-100" indicatorClassName="bg-accent-teal" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
