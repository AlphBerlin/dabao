"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, Calendar, Users, Award } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Button } from "@workspace/ui/components/button"

interface ProjectStats {
  customers?: number
  pointsIssued?: number
}

interface Project {
  id: string
  name: string
  description?: string
  status: "live" | "trial" | "setup" | "paused"
  domain?: string
  logo?: string
  trialEndsAt?: string
  stats?: ProjectStats
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const getStatusBadge = () => {
    switch (project.status) {
      case "live":
        return <Badge className="bg-green-500 text-white">Live</Badge>
      case "trial":
        return <Badge className="bg-yellow-500 text-white">Trial</Badge>
      case "setup":
        return <Badge className="bg-primary text-white">Setup</Badge>
      case "paused":
        return <Badge variant="outline">Paused</Badge>
      default:
        return null
    }
  }

  const getRemainingDays = () => {
    if (!project.trialEndsAt) return null

    const now = new Date()
    const trialEnd = new Date(project.trialEndsAt)
    const diffTime = trialEnd.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const trialDays = getRemainingDays()

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {project.logo ? (
              <div className="h-10 w-10 rounded-lg mr-3 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={project.logo || "/placeholder.svg"}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-lg mr-3 bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold">
                  {project.name.substring(0, 1).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{project.name}</h3>
              <div className="flex items-center mt-1">
                {getStatusBadge()}
                {project.domain && (
                  <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">{project.domain}</span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <ArrowUpRight size={16} />
                </motion.div>
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Duplicate Project</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {(project.stats || trialDays !== null) && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-2">
            {project.stats?.customers !== undefined && (
              <div className="flex flex-col">
                <div className="flex items-center text-neutral-500 dark:text-neutral-400 mb-1">
                  <Users size={14} className="mr-1" />
                  <span className="text-xs">Customers</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {project.stats.customers.toLocaleString()}
                </span>
              </div>
            )}

            {project.stats?.pointsIssued !== undefined && (
              <div className="flex flex-col">
                <div className="flex items-center text-neutral-500 dark:text-neutral-400 mb-1">
                  <Award size={14} className="mr-1" />
                  <span className="text-xs">Points</span>
                </div>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {project.stats.pointsIssued.toLocaleString()}
                </span>
              </div>
            )}

            {trialDays !== null && (
              <div className="flex flex-col">
                <div className="flex items-center text-neutral-500 dark:text-neutral-400 mb-1">
                  <Calendar size={14} className="mr-1" />
                  <span className="text-xs">Trial</span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    trialDays <= 7 ? "text-red-500" : "text-neutral-900 dark:text-white"
                  }`}
                >
                  {trialDays} days left
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <Button asChild className="w-full" variant="outline">
            <Link href={`/projects/${project.id}`}>View Project</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
