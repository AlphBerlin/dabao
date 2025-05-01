"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { BarChart2, Users, Award, Globe, MessageSquare, CreditCard, Settings, ChevronRight } from "lucide-react"

interface SidebarProps {
  projectId: string
}

export function Sidebar({ projectId }: SidebarProps) {
  const pathname = usePathname()

  const sidebarItems = [
    {
      name: "Overview",
      path: `/dashboard/projects/${projectId}`,
      icon: <BarChart2 size={20} />,
      exact: true,
    },
    {
      name: "Customers",
      path: `/dashboard/projects/${projectId}/customers`,
      icon: <Users size={20} />,
    },
    {
      name: "Points & Rewards",
      path: `/dashboard/projects/${projectId}/rewards`,
      icon: <Award size={20} />,
    },
    {
      name: "Domain & Branding",
      path: `/dashboard/projects/${projectId}/domain`,
      icon: <Globe size={20} />,
    },
    {
      name: "AI Assistant",
      path: `/dashboard/projects/${projectId}/assistant`,
      icon: <MessageSquare size={20} />,
    },
    {
      name: "Billing & Trial",
      path: `/dashboard/projects/${projectId}/billing`,
      icon: <CreditCard size={20} />,
    },
    {
      name: "Settings",
      path: `/dashboard/projects/${projectId}/settings`,
      icon: <Settings size={20} />,
    },
  ]

  return (
    <aside className="w-64 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">Project Settings</h2>
        </div>
      </div>
      <nav className="mt-2 px-3 pb-4">
        {sidebarItems.map((item) => {
          const isActive = item.exact ? pathname === item.path : pathname.startsWith(item.path)

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg font-medium text-sm mb-1.5 group transition-colors relative ${
                isActive
                  ? "text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                  : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              <span
                className={`mr-3 ${
                  isActive
                    ? "text-primary-500"
                    : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                }`}
              >
                {item.icon}
              </span>
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r"
                  layoutId="sidebar-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
