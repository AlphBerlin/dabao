"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { PointsSummary } from "@/components/points-summary"
import { RewardsShowcase } from "@/components/rewards-showcase"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Confetti } from "@/components/confetti"
import { DashboardQrCode } from "@/components/dashboard-qr-code"
import { ReferralCard } from "@/components/referral-card"

export function DashboardPage() {
  const [showConfetti, setShowConfetti] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  const handlePointsEarned = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

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
      {showConfetti && <Confetti />}
      <DashboardHeader />
      <main className="px-4 sm:px-6 lg:px-8 pb-20 pt-20">
        <motion.div className="max-w-5xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants}>
            <PointsSummary onPointsEarned={handlePointsEarned} />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="md:col-span-2">
              <motion.div variants={itemVariants}>
                <RewardsShowcase />
              </motion.div>
            </div>
            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <DashboardQrCode />
              </motion.div>
              <motion.div variants={itemVariants}>
                <ReferralCard />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
