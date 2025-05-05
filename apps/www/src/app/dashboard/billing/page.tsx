"use client"

import { motion } from "framer-motion"
import { CreditCard, BarChart2, Database, Users } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { CircularProgress } from "@workspace/ui/components/CircularProgress"
import { MainLayout } from "@/components/layout/MainLayout"

// Mock billing usage data
const mockBillingUsage = {
  apiCalls: {
    used: 45000,
    limit: 100000,
  },
  storage: {
    used: 2.5,
    limit: 10,
  },
  customers: {
    used: 1587,
    limit: 5000,
  },
}

// Mock pricing plans
const mockPlans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "For individuals and small projects",
    features: ["Up to 500 customers", "Basic analytics", "Standard support"],
    isPopular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    description: "For growing businesses",
    features: ["Up to 2,000 customers", "Advanced analytics", "Priority support", "Custom domain"],
    isPopular: true,
  },
  {
    id: "pro",
    name: "Professional",
    price: 79,
    description: "For established businesses",
    features: ["Up to 10,000 customers", "Advanced analytics", "Priority support", "Custom domain", "API access"],
    isPopular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    description: "For large organizations",
    features: [
      "Unlimited customers",
      "Advanced analytics",
      "Dedicated support",
      "Custom domain",
      "API access",
      "White labeling",
    ],
    isPopular: false,
  },
]

export default function BillingPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Billing & Usage</h1>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Manage your subscription and monitor resource usage
              </p>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">API Calls</h3>
                  <CircularProgress
                    value={(mockBillingUsage.apiCalls.used / mockBillingUsage.apiCalls.limit) * 100}
                    size={120}
                    strokeWidth={8}
                  />
                  <p className="mt-4 font-medium">
                    {mockBillingUsage.apiCalls.used?.toLocaleString()} /{" "}
                    {mockBillingUsage.apiCalls.limit?.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-4">
                    <BarChart2 size={16} className="text-neutral-500 dark:text-neutral-400 mr-2" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Refreshes monthly</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Storage</h3>
                  <CircularProgress
                    value={(mockBillingUsage.storage.used / mockBillingUsage.storage.limit) * 100}
                    size={120}
                    strokeWidth={8}
                  />
                  <p className="mt-4 font-medium">
                    {mockBillingUsage.storage.used} GB / {mockBillingUsage.storage.limit} GB
                  </p>
                  <div className="flex items-center mt-4">
                    <Database size={16} className="text-neutral-500 dark:text-neutral-400 mr-2" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Includes images & data</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Customers</h3>
                  <CircularProgress
                    value={(mockBillingUsage.customers.used / mockBillingUsage.customers.limit) * 100}
                    size={120}
                    strokeWidth={8}
                  />
                  <p className="mt-4 font-medium">
                    {mockBillingUsage.customers.used?.toLocaleString()} /{" "}
                    {mockBillingUsage.customers.limit?.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-4">
                    <Users size={16} className="text-neutral-500 dark:text-neutral-400 mr-2" />
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Across all projects</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Plans */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Available Plans</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mockPlans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden ${
                    plan.isPopular ? "border-2 border-primary" : "border border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl">Popular</div>
                    </div>
                  )}
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-neutral-500 dark:text-neutral-400">/month</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">{plan.description}</p>
                    <Button variant={plan.isPopular ? "default" : "outline"} className="w-full mb-4">
                      {plan.id === "free" ? "Current Plan" : "Upgrade"}
                    </Button>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <svg
                            className="h-4 w-4 text-green-500 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Payment Method</h2>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg mr-4">
                    <CreditCard size={24} className="text-neutral-500 dark:text-neutral-400" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Add Payment Method</h3>
                        <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                          Add a credit card to upgrade to a paid plan
                        </p>
                      </div>

                      <div className="mt-4 md:mt-0">
                        <Button>Add Payment Method</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing History */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Billing History</h2>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-full inline-block mb-4">
                    <CreditCard size={24} className="text-neutral-500 dark:text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">No billing history available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
