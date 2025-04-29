"use client"

import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"
import { RewardHistoryFilter } from "@/components/reward-history-filter"
import { RewardHistoryList } from "@/components/reward-history-list"
import { RewardHistoryStats } from "@/components/reward-history-stats"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function RewardHistoryPage() {
  const isMobile = useMediaQuery("(max-width: 768px)")

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
    <div className="min-h-screen bg-white">
      <DashboardHeader />
      <main className="px-4 sm:px-6 lg:px-8 pb-20 pt-20">
        <motion.div className="max-w-5xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-6">
            <Button variant="ghost" className="mb-4 -ml-2" asChild>
              <Link href="/rewards">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rewards
              </Link>
            </Button>

            <h1 className="text-2xl font-bold text-tn-blue mb-2">Reward History</h1>
            <p className="text-mid-gray mb-6">Track your rewards journey and achievements</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <motion.div variants={itemVariants} className="mb-6">
                <RewardHistoryFilter />
              </motion.div>

              <motion.div variants={itemVariants}>
                <RewardHistoryList />
              </motion.div>
            </div>

            <div>
              <motion.div variants={itemVariants}>
                <RewardHistoryStats />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
