"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight, Calendar, Award } from "lucide-react"
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Avatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { ExternalLink, MoreHorizontal, Settings, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Project } from "@prisma/client"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  // Extract settings from project, with fallbacks
  const settings = project.settings as any || {}
  const theme = project.theme as any || {}
  const customerCount = settings.totalCustomers || 0
  const primaryColor = theme.primaryColor || theme.primary || "#6366f1"
  const status = project.status || "draft"

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Project Header */}
      <div 
        className="h-3" 
        style={{ backgroundColor: primaryColor }}
      />
      
      <CardContent className="pt-6 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar
              className="h-12 w-12 border-2 border-white shadow-sm"
              style={{ backgroundColor: primaryColor + "20" }}
            >
              <span className="font-semibold text-lg" style={{ color: primaryColor }}>
                {project.name.charAt(0).toUpperCase()}
              </span>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                  {project.name}
                </h3>
                <Badge variant={status === "live" ? "success" : "secondary"} className="capitalize">
                  {status}
                </Badge>
              </div>
              
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                {project.description || `A loyalty program for ${project.name}`}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-4 text-sm">
          <div className="flex items-center text-neutral-600 dark:text-neutral-400">
            <Users className="h-4 w-4 mr-1" />
            <span>{customerCount?.toLocaleString()} customers</span>
          </div>
          
          <div className="text-neutral-500 dark:text-neutral-400">
            Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/projects/${project.id}/settings`} className="flex items-center">
              <Settings className="mr-1 h-4 w-4" />
              Settings
            </Link>
          </Button>
          
          <Button size="sm" asChild>
            <Link href={`/dashboard/projects/${project.id}`} className="flex items-center">
              <ExternalLink className="mr-1 h-4 w-4" />
              Open
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
