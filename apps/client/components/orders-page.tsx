"use client"

import { motion } from "framer-motion"
import { DashboardHeader } from "@/components/dashboard-header"
import { MobileNavigation } from "@/components/mobile-navigation"
import { useMediaQuery } from "@workspace/ui/hooks/use-media-query"
import { OrdersList } from "@/components/orders-list"
import { OrdersFilter } from "@/components/orders-filter"

export function OrdersPage() {
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
            <h1 className="text-2xl font-bold text-tn-blue mb-2">Order History</h1>
            <p className="text-mid-gray mb-6">View your past orders and transactions</p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <OrdersFilter />
          </motion.div>

          <motion.div variants={itemVariants}>
            <OrdersList />
          </motion.div>
        </motion.div>
      </main>
      {isMobile && <MobileNavigation />}
    </div>
  )
}
