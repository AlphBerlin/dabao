"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@workspace/ui/components/progress"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

interface PointsSummaryProps {
  onPointsEarned?: () => void
}

export function PointsSummary({ onPointsEarned }: PointsSummaryProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [points, setPoints] = useState(1250)
  const [level, setLevel] = useState("Silver")
  const [progress, setProgress] = useState(83)

  return (
    <Card className="relative overflow-hidden border-none shadow-lg">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-tn-blue">Welcome back, Jordan!</h2>
                <p className="text-mid-gray">You're on your way to {level === "Silver" ? "Gold" : "Platinum"} status</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-tn-blue">{level} Member</h3>
                  <p className="text-sm text-mid-gray">
                    {level === "Silver" ? "250 points to Gold" : "500 points to Platinum"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-mid-gray">
                    {points} / {level === "Silver" ? "1500" : "2000"}
                  </span>
                </div>
              </div>

              <div className="relative">
                <Progress value={progress} className="h-3 bg-gray-100" />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                  <div
                    className={cn(
                      "absolute top-0 left-0 h-full bg-accent-teal/20 w-0",
                      showAnimation && "animate-progress-flash",
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                <div className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-1">
                  <div className="h-2 w-2 rounded-full bg-bronze" />
                  <span>Bronze</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs ${level === "Silver" || level === "Gold" ? "bg-accent-teal/10 text-accent-teal font-medium" : "bg-gray-100"} rounded-full px-2 py-1`}
                >
                  <div className="h-2 w-2 rounded-full bg-silver" />
                  <span>Silver</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs ${level === "Gold" ? "bg-accent-teal/10 text-accent-teal font-medium" : "bg-gray-100 text-mid-gray"} rounded-full px-2 py-1`}
                >
                  <div className="h-2 w-2 rounded-full bg-gold" />
                  <span>Gold</span>
                </div>
                <div className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-1 text-mid-gray">
                  <div className="h-2 w-2 rounded-full bg-platinum/50" />
                  <span>Platinum</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <motion.div
              className="text-center mb-4"
              animate={{ scale: showAnimation ? [1, 1.1, 1] : 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative inline-block">
                <div className="text-5xl font-bold text-tn-blue relative">
                  {points}
                  <AnimatePresence>
                    {showAnimation && (
                      <motion.div
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: 1, y: -20 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-2 -right-2 text-sm font-normal text-accent-teal"
                      >
                        +25
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-mid-gray">Total Points</p>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-2 w-full">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="text-lg font-bold text-tn-blue">3</div>
                <div className="text-xs text-mid-gray">Rewards</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-gray-50 rounded-lg p-3 text-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="text-lg font-bold text-tn-blue">5</div>
                <div className="text-xs text-mid-gray">Badges</div>
              </motion.div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
