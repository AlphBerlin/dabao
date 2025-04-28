"use client"

import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  BarChart2,
  TrendingUp,
  Users,
  Award,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Calendar,
  CreditCard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { ProgressBar } from "@workspace/ui/components/ProgressBar"
import { CircularProgress } from "@workspace/ui/components/CircularProgress"
import { ProjectLayout } from "@/components/layout/ProjectLayout"

// Mock customer data
const mockCustomers = [
  {
    id: "cust-1",
    name: "Emma Wilson",
    email: "emma@example.com",
    pointsBalance: 2450,
    tier: "Platinum",
    lastActive: "2023-07-20T14:30:00Z",
  },
  {
    id: "cust-2",
    name: "James Miller",
    email: "james@example.com",
    pointsBalance: 1870,
    tier: "Gold",
    lastActive: "2023-07-19T09:15:00Z",
  },
  {
    id: "cust-3",
    name: "Olivia Brown",
    email: "olivia@example.com",
    pointsBalance: 1340,
    tier: "Silver",
    lastActive: "2023-07-18T16:45:00Z",
  },
  {
    id: "cust-4",
    name: "Noah Davis",
    email: "noah@example.com",
    pointsBalance: 980,
    tier: "Bronze",
    lastActive: "2023-07-17T11:20:00Z",
  },
  {
    id: "cust-5",
    name: "Sophia Martinez",
    email: "sophia@example.com",
    pointsBalance: 750,
    tier: "Bronze",
    lastActive: "2023-07-16T13:10:00Z",
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string

  // In a real app, you would fetch project data based on the ID
  const project = {
    id: projectId,
    name: "Coffee Rewards",
    status: "live",
    domain: "coffee-rewards.app",
    createdAt: "2023-06-15",
    stats: {
      customers: 1245,
      pointsIssued: 45678,
      activeUsers: 876,
      redemptions: 320,
      revenue: 12500,
    },
    trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  }

  return (
    <ProjectLayout>
      <div className="p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-lg mr-4 bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold text-lg">
                  {project.name.substring(0, 1).toUpperCase()}
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{project.name}</h1>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">{project.domain}</span>
                  {project.status === "live" && <Badge className="ml-2 bg-green-500 text-white">Live</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex">
              <Button variant="outline" className="mr-2" asChild>
                <a href={`https://${project.domain}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} className="mr-2" />
                  Visit Site
                </a>
              </Button>

              <Button>Manage Program</Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Customers</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {project.stats?.customers.toLocaleString() || 0}
                    </h3>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                    <Users size={24} className="text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">+32 this week</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Points Issued</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {project.stats?.pointsIssued.toLocaleString() || 0}
                    </h3>
                  </div>
                  <div className="bg-secondary-100 dark:bg-secondary-900/30 p-3 rounded-lg">
                    <Award size={24} className="text-secondary-600 dark:text-secondary-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">+755 this week</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Active Users</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {project.stats?.activeUsers.toLocaleString() || 0}
                    </h3>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <Activity size={24} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">+128 this week</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Activity Graph */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Recent Activity</CardTitle>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="h-8">
                        Day
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        Week
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        Month
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <BarChart2 size={32} className="text-neutral-300 dark:text-neutral-600" />
                    <span className="ml-2 text-neutral-400 dark:text-neutral-500">Activity chart will appear here</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Top Customers</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ArrowUpRight size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          <th className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-l-lg">Customer</th>
                          <th className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800">Points</th>
                          <th className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800">Tier</th>
                          <th className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-r-lg">Last Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {mockCustomers.map((customer) => (
                          <tr key={customer.id}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
                                  {customer.name.charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                    {customer.name}
                                  </p>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{customer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                              {customer.pointsBalance.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge
                                className={`${
                                  customer.tier === "Platinum"
                                    ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                                    : customer.tier === "Gold"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
                                      : customer.tier === "Silver"
                                        ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                        : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300"
                                }`}
                              >
                                {customer.tier}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                              {new Date(customer.lastActive).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Usage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center mb-6">
                    <CircularProgress value={62} size={120} strokeWidth={8} />
                    <p className="mt-4 font-medium">API Usage</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                        <span>Storage</span>
                        <span>1.2 GB / 5 GB</span>
                      </div>
                      <ProgressBar value={24} max={100} variant="secondary" size="sm" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-neutral-700 dark:text-neutral-300 mb-1">
                        <span>Customers</span>
                        <span>{project.stats?.customers || 0} / 2,000</span>
                      </div>
                      <ProgressBar
                        value={project.stats?.customers || 0}
                        max={2000}
                        variant={project.stats && project.stats.customers > 1500 ? "warning" : "success"}
                        size="sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trial Status */}
              {project.trialEndsAt && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mb-3">
                        <TrendingUp size={24} className="text-yellow-600 dark:text-yellow-400" />
                      </div>

                      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Trial Status</h2>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                        Your trial ends in{" "}
                        {Math.ceil(
                          (new Date(project.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                        )}{" "}
                        days
                      </p>

                      <ProgressBar
                        value={
                          30 -
                          Math.ceil(
                            (new Date(project.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                          )
                        }
                        max={30}
                        variant="warning"
                        className="mb-6"
                      />

                      <Button>Upgrade Now</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Users size={16} className="mr-2" />
                    Add Customers
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Award size={16} className="mr-2" />
                    Issue Points
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <BarChart2 size={16} className="mr-2" />
                    View Analytics
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Calendar size={16} className="mr-2" />
                    Schedule Campaign
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard size={16} className="mr-2" />
                    Manage Billing
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </ProjectLayout>
  )
}
