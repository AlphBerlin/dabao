"use client"

import { motion } from "framer-motion"
import { Settings, User, CreditCard, Bell, Shield, Globe, Palette } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { MainLayout } from "@/components/layout/MainLayout"
import Link from "next/link"

export default function SettingsPage() {
  const settingsCategories = [
    {
      id: "profile",
      name: "Profile",
      description: "Manage your personal information and preferences",
      icon: User,
      path: "/dashboard/profile",
    },
    {
      id: "billing",
      name: "Billing & Plans",
      description: "View and manage your subscription and billing details",
      icon: CreditCard,
      path: "/billing",
    },
    {
      id: "notifications",
      name: "Notifications",
      description: "Configure how you receive updates and alerts",
      icon: Bell,
      path: "/settings/notifications",
    },
    {
      id: "security",
      name: "Security",
      description: "Manage your account security and authentication methods",
      icon: Shield,
      path: "/settings/security",
    },
    {
      id: "domains",
      name: "Domains",
      description: "Manage custom domains for your loyalty programs",
      icon: Globe,
      path: "/settings/domains",
    },
    {
      id: "appearance",
      name: "Appearance",
      description: "Customize the look and feel of your dashboard",
      icon: Palette,
      path: "/settings/appearance",
    },
  ]

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center mb-8">
            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg mr-4">
              <Settings size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsCategories.map((category) => (
              <Link key={category.id} href={category.path}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">
                        <category.icon size={20} className="text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{category.name}</h3>
                        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{category.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
