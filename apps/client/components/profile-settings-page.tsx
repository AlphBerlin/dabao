"use client"

import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"
import { ProfileSettingsForm } from "@/components/profile-settings-form"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function ProfileSettingsPage() {
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
        <motion.div className="max-w-3xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="mb-6">
            <Button variant="ghost" className="mb-4 -ml-2" asChild>
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Link>
            </Button>

            <h1 className="text-2xl font-bold text-tn-blue mb-2">Profile Settings</h1>
            <p className="text-mid-gray mb-6">Update your personal information</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <ProfileSettingsForm />
          </motion.div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
