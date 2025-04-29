"use client"
import { motion } from "framer-motion"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
import { AdminGameSettings } from "@/components/admin-game-settings"
import { AdminPrizeSettings } from "@/components/admin-prize-settings"
import { AdminGameStats } from "@/components/admin-game-stats"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function AdminGamesPage() {
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
    <div className="min-h-screen bg-white p-6">
      <motion.div className="max-w-5xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="mb-6">
          <Button variant="ghost" className="mb-4 -ml-2" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Link>
          </Button>

          <h1 className="text-2xl font-bold text-tn-blue mb-2">Games Administration</h1>
          <p className="text-mid-gray mb-6">Configure game settings, prizes, and view statistics</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tabs defaultValue="settings">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="settings">Game Settings</TabsTrigger>
              <TabsTrigger value="prizes">Prize Configuration</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <AdminGameSettings />
            </TabsContent>

            <TabsContent value="prizes">
              <AdminPrizeSettings />
            </TabsContent>

            <TabsContent value="stats">
              <AdminGameStats />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  )
}
