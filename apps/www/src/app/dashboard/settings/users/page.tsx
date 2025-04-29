"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Plus, Edit2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { MainLayout } from "@/components/layout/MainLayout"

// Mock user data
const mockUsers = [
  {
    id: "user-1",
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "admin",
    status: "active",
    avatar: "/avatars/alex.jpg",
    createdAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "user-2",
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "manager",
    status: "active",
    avatar: "/avatars/sarah.jpg",
    createdAt: "2023-02-20T14:15:00Z",
  },
  {
    id: "user-3",
    name: "Michael Brown",
    email: "michael@example.com",
    role: "user",
    status: "active",
    avatar: "/avatars/michael.jpg",
    createdAt: "2023-03-10T09:45:00Z",
  },
  {
    id: "user-4",
    name: "Emily Davis",
    email: "emily@example.com",
    role: "user",
    status: "inactive",
    avatar: "/avatars/emily.jpg",
    createdAt: "2023-04-05T11:20:00Z",
  },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers)
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "manager":
        return "secondary"
      default:
        return "outline"
    }
  }

  const deleteUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id))
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg mr-4">
                <Users size={24} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">User Management</h1>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">Manage users and their permissions</p>
              </div>
            </div>

            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Add User
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                  <thead>
                    <tr className="text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium">
                              {user.name.charAt(0)}
                            </div>
                            <span className="ml-3 text-sm font-medium text-neutral-900 dark:text-white">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={user.status === "active" ? "outline" : "secondary"}
                            className={`${
                              user.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <Button variant="ghost" size="sm" className="mr-2" onClick={() => setEditingUser(user.id)}>
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  )
}
