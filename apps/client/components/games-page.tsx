"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"
import { GamesHero } from "@/components/games-hero"
import { GamesList } from "@/components/games-list"
import { GamesHistory } from "@/components/games-history"
import { Confetti } from "@/components/confetti"

export function GamesPage() {
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [showConfetti, setShowConfetti] = useState(false)

  const handleWin = () => {
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
            <GamesHero />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <motion.div variants={itemVariants}>
                <GamesList onWin={handleWin} />
              </motion.div>
            </div>
            <div>
              <motion.div variants={itemVariants}>
                <GamesHistory />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
