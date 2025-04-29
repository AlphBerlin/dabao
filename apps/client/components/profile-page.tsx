"use client"

import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"
import { ProfileStats } from "@/components/profile-stats"
import { ProfileBadges } from "@/components/profile-badges"
import { ProfileQrCode } from "@/components/profile-qr-code"
import { ProfileActions } from "@/components/profile-actions"
import { ReferralCard } from "@/components/referral-card"

export function ProfilePage() {
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
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl font-bold text-tn-blue mb-2">My Profile</h1>
            <p className="text-mid-gray mb-6">View your stats and manage your account</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <motion.div variants={itemVariants} className="mb-6">
                <ProfileStats />
              </motion.div>

              <motion.div variants={itemVariants} className="mb-6">
                <ProfileBadges />
              </motion.div>
            </div>

            <div className="space-y-6">
              <motion.div variants={itemVariants}>
                <ProfileQrCode />
              </motion.div>

              <motion.div variants={itemVariants}>
                <ReferralCard />
              </motion.div>

              <motion.div variants={itemVariants}>
                <ProfileActions />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
