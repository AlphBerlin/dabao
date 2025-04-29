"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Plus, TrendingUp, Users, Award, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { CircularProgress } from "@workspace/ui/components/CircularProgress"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { CreateProjectCard } from "@/components/projects/CreateProjectCard"
import { AchievementCard } from "@/components/achievements/AchievementCard"
import { AIAssistant } from "@/components/ai/AIAssistant"
import { MainLayout } from "@/components/layout/MainLayout"
import Link from "next/link"

// Mock data
const mockProjects = [
  {
    id: "proj-1",
    name: "Coffee Rewards",
    status: "live",
    domain: "coffee-rewards.app",
    logo: "/placeholder.svg?height=40&width=40",
    stats: {
      customers: 1245,
      pointsIssued: 45678,
    },
  },
  {
    id: "proj-2",
    name: "Bookstore Loyalty",
    status: "trial",
    domain: "bookstore-loyalty.app",
    trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      customers: 342,
      pointsIssued: 12890,
    },
  },
  {
    id: "proj-3",
    name: "Fitness Club",
    status: "setup",
    stats: {
      customers: 0,
      pointsIssued: 0,
    },
  },
]

const mockAchievements = [
  {
    id: "ach-1",
    title: "First Campaign",
    description: "Launch your first loyalty campaign",
    icon: "trophy",
    progress: 0.2,
    total: 1,
    earned: true,
  },
  {
    id: "ach-2",
    title: "Customer Milestone",
    description: "Reach 1,000 loyalty program members",
    icon: "users",
    progress: 85,
    total: 1000,
    earned: true,
  },
  {
    id: "ach-3",
    title: "Point Millionaire",
    description: "Issue 1,000,000 loyalty points",
    icon: "award",
    progress: 58568,
    total: 1000000,
    earned: false,
  },
  {
    id: "ach-4",
    title: "Global Reach",
    description: "Have customers from 10 different countries",
    icon: "globe",
    progress: 3,
    total: 10,
    earned: false,
  },
]

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [showAllAchievements, setShowAllAchievements] = useState(false)

  const recentAchievements = mockAchievements.filter((a) => a.earned).slice(0, 3)
  const displayedAchievements = showAllAchievements ? mockAchievements.filter((a) => a.earned) : recentAchievements

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back!</h1>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Manage your loyalty programs and monitor their performance
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <Button asChild>
                <Link href="/projects/new">
                  <Plus size={16} className="mr-2" />
                  New Project
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Projects</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{mockProjects.length}</h3>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">
                  {mockProjects.filter((p) => p.status === "live").length} active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Customers</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {mockProjects
                        .reduce((total, project) => total + (project.stats?.customers || 0), 0)
                        .toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-secondary-100 dark:bg-secondary-900/30 p-3 rounded-lg">
                    <Users size={24} className="text-secondary-600 dark:text-secondary-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">+124 this week</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Points Issued</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {mockProjects
                        .reduce((total, project) => total + (project.stats?.pointsIssued || 0), 0)
                        .toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <Award size={24} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">+2,540 this week</div>
              </CardContent>
            </Card>
          </div>

          {/* Your Projects */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Your Projects</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects" className="flex items-center">
                  View All
                  <ChevronRight size={16} className="ml-1" />
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <CircularProgress size={40} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                <CreateProjectCard />
              </div>
            )}
          </div>

          {/* Achievements Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Recent Achievements</h2>
              {recentAchievements.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAllAchievements(!showAllAchievements)}>
                  {showAllAchievements ? "Show Less" : "Show All"}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <CircularProgress size={40} value={100}/>
              </div>
            ) : displayedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displayedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full mb-4">
                      <Award size={24} className="text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-center">
                      No achievements yet. Keep building your loyalty programs to earn badges!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <AIAssistant />
        </motion.div>
      </div>
    </MainLayout>
  )
}
