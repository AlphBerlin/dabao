"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Gift, Calendar, CheckCircle, Clock, Award, Sparkles } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { useToast } from "@workspace/ui/hooks/use-toast"

export function RewardHistoryList() {
  const { toast } = useToast()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rewards, setRewards] = useState(rewardData)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleCelebrate = (id: string) => {
    toast({
      title: "Achievement Celebrated! 🎉",
      description: "You've shared your achievement with your friends.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-tn-blue">Your Rewards Journey</h2>
        <Badge variant="outline" className="bg-accent-teal/10 text-accent-teal border-accent-teal/20">
          {rewards.length} Total Rewards
        </Badge>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 z-0"></div>

        <div className="space-y-6 relative z-10">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="relative"
            >
              <div
                className={cn(
                  "absolute left-6 top-6 w-3 h-3 rounded-full -translate-x-1.5 z-20",
                  reward.isRedeemed ? "bg-mid-gray" : "bg-accent-teal",
                )}
              ></div>

              <Card
                className={cn(
                  "border-none shadow-lg ml-10",
                  reward.isRedeemed ? "opacity-75" : "",
                  expandedId === reward.id ? "ring-2 ring-accent-teal/20" : "",
                )}
              >
                <CardContent className="p-0">
                  <div
                    className={cn(
                      "p-4 cursor-pointer",
                      reward.isRedeemed ? "bg-gray-50" : "bg-white",
                      expandedId === reward.id ? "pb-2" : "",
                    )}
                    onClick={() => toggleExpand(reward.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "p-2 rounded-full shrink-0",
                          reward.isRedeemed ? "bg-gray-100 text-mid-gray" : "bg-accent-teal/10 text-accent-teal",
                        )}
                      >
                        <Gift className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={cn("font-medium", reward.isRedeemed ? "text-mid-gray" : "text-tn-blue")}>
                            {reward.title}
                          </h3>
                          <div className="flex items-center shrink-0">
                            {reward.isRedeemed ? (
                              <Badge variant="outline" className="bg-gray-100 text-mid-gray border-gray-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Redeemed
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-mid-gray mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {reward.isRedeemed ? `Redeemed on ${reward.redeemedDate}` : `Expires on ${reward.expiryDate}`}
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <div
                            className={cn(
                              "text-sm font-medium",
                              reward.isRedeemed ? "text-mid-gray" : "text-accent-teal",
                            )}
                          >
                            {reward.pointsCost} points
                          </div>

                          {reward.isSpecial && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                reward.isRedeemed
                                  ? "bg-gray-100 text-mid-gray border-gray-200"
                                  : "bg-amber-50 text-amber-600 border-amber-200",
                              )}
                            >
                              <Award className="h-3 w-3 mr-1" />
                              Special
                            </Badge>
                          )}

                          {reward.isLimited && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                reward.isRedeemed
                                  ? "bg-gray-100 text-mid-gray border-gray-200"
                                  : "bg-purple-50 text-purple-600 border-purple-200",
                              )}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Limited
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === reward.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2">
                          <div className="p-3 bg-gray-50 rounded-md mb-3">
                            <p className="text-sm text-mid-gray">{reward.description}</p>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            {reward.isRedeemed ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => handleCelebrate(reward.id)}
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Celebrate
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1">
                                  View Details
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" className="gap-1 bg-accent-teal hover:bg-accent-teal/90 text-white">
                                  Redeem Now
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1">
                                  Save for Later
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Sample reward data
const rewardData = [
  {
    id: "reward-1",
    title: "10% Off Next Purchase",
    description:
      "Get 10% off your next purchase in any of our stores or online. Valid for all products except sale items.",
    pointsCost: 500,
    isRedeemed: false,
    expiryDate: "Dec 31, 2023",
    isSpecial: false,
    isLimited: false,
  },
  {
    id: "reward-2",
    title: "Free Standard Shipping",
    description: "Enjoy free standard shipping on your next order. No minimum purchase required.",
    pointsCost: 300,
    isRedeemed: true,
    redeemedDate: "Nov 15, 2023",
    isSpecial: false,
    isLimited: false,
  },
  {
    id: "reward-3",
    title: "Exclusive Member Gift",
    description: "Receive an exclusive gift with your next purchase. Available while supplies last.",
    pointsCost: 1500,
    isRedeemed: false,
    expiryDate: "Jan 15, 2024",
    isSpecial: true,
    isLimited: true,
  },
  {
    id: "reward-4",
    title: "Early Access to Winter Sale",
    description: "Get 24-hour early access to our Winter Sale with exclusive member pricing.",
    pointsCost: 800,
    isRedeemed: true,
    redeemedDate: "Oct 1, 2023",
    isSpecial: true,
    isLimited: false,
  },
  {
    id: "reward-5",
    title: "Free Coffee Voucher",
    description: "Enjoy a free coffee at any of our partner cafés. Show this reward at checkout.",
    pointsCost: 400,
    isRedeemed: false,
    expiryDate: "Dec 15, 2023",
    isSpecial: false,
    isLimited: false,
  },
  {
    id: "reward-6",
    title: "Birthday Surprise Reward",
    description: "Special reward unlocked on your birthday month. Surprise gift or discount!",
    pointsCost: 0,
    isRedeemed: true,
    redeemedDate: "Sep 5, 2023",
    isSpecial: true,
    isLimited: false,
  },
]
