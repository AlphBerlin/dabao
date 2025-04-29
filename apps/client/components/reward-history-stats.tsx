"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Button } from "@workspace/ui/components/button"
import { Gift, TrendingUp, Award, Crown } from "lucide-react"
import Link from "next/link"

export function RewardHistoryStats() {
  // Sample stats data
  const stats = {
    totalRedeemed: 8,
    pointsSpent: 4200,
    pointsSaved: 1250,
    nextMilestone: 5000,
    progress: 84, // percentage to next milestone
    level: "Silver",
    streak: 3, // consecutive months with redemptions
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-tn-blue flex items-center text-base">
            <Award className="h-4 w-4 mr-2 text-accent-teal" />
            Rewards Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-tn-blue">{stats.totalRedeemed}</div>
              <div className="text-xs text-mid-gray">Rewards Redeemed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent-teal">{stats.pointsSpent}</div>
              <div className="text-xs text-mid-gray">Points Spent</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-mid-gray">Current Balance</span>
                <span className="font-medium text-tn-blue">{stats.pointsSaved} points</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            <div className="p-3 bg-accent-teal/5 rounded-lg border border-accent-teal/10">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-accent-teal" />
                <h4 className="font-medium text-sm text-tn-blue">Next Milestone</h4>
              </div>
              <p className="text-xs text-mid-gray mb-2">
                Redeem {stats.nextMilestone - stats.pointsSpent} more points to reach Gold status!
              </p>
              <Progress value={stats.progress} className="h-1.5 mb-2" indicatorClassName="bg-accent-teal" />
              <div className="flex justify-between text-xs">
                <span className="text-mid-gray">{stats.pointsSpent}</span>
                <span className="text-mid-gray">{stats.nextMilestone}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-tn-blue">{stats.streak}-Month Streak!</div>
                  <div className="text-xs text-mid-gray">Keep redeeming rewards</div>
                </div>
              </div>
              <div className="text-amber-600 text-xs font-medium">+50 bonus pts</div>
            </div>
          </div>

          <div className="mt-4">
            <Button className="w-full bg-accent-teal hover:bg-accent-teal/90 text-white" asChild>
              <Link href="/rewards">
                <Gift className="h-4 w-4 mr-2" />
                Browse Available Rewards
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-tn-blue text-white p-4">
          <h3 className="font-medium mb-1">Reward Achievements</h3>
          <p className="text-xs text-white/80">Unlock special badges by redeeming rewards</p>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                whileHover={achievement.unlocked ? { y: -5 } : {}}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                    achievement.unlocked ? "bg-accent-teal/10" : "bg-gray-100 opacity-40"
                  }`}
                >
                  <achievement.icon
                    className={`h-6 w-6 ${achievement.unlocked ? "text-accent-teal" : "text-gray-400"}`}
                  />
                </div>
                <span className={`text-xs ${achievement.unlocked ? "text-tn-blue font-medium" : "text-mid-gray"}`}>
                  {achievement.name}
                </span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Sample achievements data
const achievements = [
  {
    id: "achievement-1",
    name: "First Reward",
    icon: Gift,
    unlocked: true,
  },
  {
    id: "achievement-2",
    name: "Big Spender",
    icon: Crown,
    unlocked: true,
  },
  {
    id: "achievement-3",
    name: "Collector",
    icon: Award,
    unlocked: false,
  },
  {
    id: "achievement-4",
    name: "Loyal",
    icon: TrendingUp,
    unlocked: true,
  },
  {
    id: "achievement-5",
    name: "VIP",
    icon: Crown,
    unlocked: false,
  },
  {
    id: "achievement-6",
    name: "Explorer",
    icon: Gift,
    unlocked: false,
  },
]
