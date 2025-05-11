"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { TrendingUp, Award, Star, Users, ExternalLink, Settings, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Progress } from "@workspace/ui/components/progress"
import { Project } from "@prisma/client"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Extract settings from project, with fallbacks
  const settings = project.settings as any || {}
  const theme = project.theme as any || {}
  const customerCount = settings.totalCustomers || 0
  const totalPoints = settings.totalPoints || 0
  const totalRewards = settings.totalRewards || 0
  const pointsName = settings.pointsName || "Points"
  const primaryColor = theme.primaryColor || theme.primary || "#6366f1"
  const status = project.status || "draft"
  
  const statusColors = {
    live: "bg-green-500",
    draft: "bg-amber-500",
    archived: "bg-neutral-500",
  }
  
  const statusColor = statusColors[status] || statusColors.draft

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all border-neutral-200/70 dark:border-neutral-800/70">
        {/* Project Header */}
        <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: primaryColor }}></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                className="h-10 w-10 rounded-md border border-neutral-200 dark:border-neutral-800 shadow-sm"
                style={{ backgroundColor: primaryColor + "15" }}
              >
                <span className="font-semibold text-base" style={{ color: primaryColor }}>
                  {project.name.charAt(0).toUpperCase()}
                </span>
              </Avatar>
              
              <div>
                <h3 className="font-medium text-base text-neutral-900 dark:text-white">
                  {project.name}
                </h3>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className={`text-xs px-1.5 py-0 h-5 ${statusColor} bg-opacity-10 capitalize`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor} mr-1`}></span>
                    {status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <MoreHorizontal className="h-5 w-5 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors" />
          </div>
          
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3 line-clamp-2">
            {project.description || `A loyalty program for ${project.name}`}
          </p>
        </div>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 text-center">
            <div className="py-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center p-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium">{customerCount?.toLocaleString()}</span>
                <span className="text-xs text-neutral-500">Customers</span>
              </div>
            </div>
            
            <div className="py-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center p-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 mb-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-medium">{totalPoints?.toLocaleString()}</span>
                <span className="text-xs text-neutral-500">{pointsName}</span>
              </div>
            </div>
            
            <div className="py-3">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center p-1.5 rounded-full bg-green-50 dark:bg-green-900/20 mb-1.5">
                  <Award className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-medium">{totalRewards}</span>
                <span className="text-xs text-neutral-500">Rewards</span>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="border-t border-neutral-100 dark:border-neutral-800 px-6 py-4">
          <div className="flex justify-between w-full">
            <Button variant="outline" size="sm" asChild className="text-xs h-8">
              <Link href={`/dashboard/projects/${project.id}/settings`} className="flex items-center">
                <Settings className="mr-1.5 h-3.5 w-3.5" />
                Settings
              </Link>
            </Button>
            
            <Button size="sm" asChild className="text-xs h-8">
              <Link href={`/dashboard/projects/${project.id}`} className="flex items-center">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open Dashboard
              </Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
