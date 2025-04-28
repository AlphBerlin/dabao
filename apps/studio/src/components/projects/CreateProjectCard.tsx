"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Card } from "@workspace/ui/components/card"

export function CreateProjectCard() {
  const router = useRouter()

  return (
    <Card
      className="h-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 cursor-pointer transition-colors"
      onClick={() => router.push("/projects/new")}
    >
      <motion.div
        whileHover={{ y: -8 }}
        whileTap={{ scale: 0.97 }}
        className="flex flex-col items-center justify-center p-6 h-full"
      >
        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <Plus size={24} className="text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">Create New Project</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
          Start a new loyalty program for your brand
        </p>
      </motion.div>
    </Card>
  )
}
