"use client"

import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"
import { RewardsGrid } from "@/components/rewards-grid"
import { RewardsCategories } from "@/components/rewards-categories"
import { Button } from "@workspace/ui/components/button"
import { History } from "lucide-react"
import Link from "next/link"

export function RewardsPage() {
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
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-tn-blue mb-2">Rewards Marketplace</h1>
              <p className="text-mid-gray">Redeem your points for exclusive rewards</p>
            </div>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/rewards/history">
                <History className="h-4 w-4" />
                View Reward History
              </Link>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <RewardsCategories />
          </motion.div>

          <motion.div variants={itemVariants}>
            <RewardsGrid />
          </motion.div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
