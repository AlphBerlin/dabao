"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Users, Award, ChevronRight, Search } from "lucide-react"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { CircularProgress } from "@workspace/ui/components/CircularProgress"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { CreateProjectCard } from "@/components/projects/CreateProjectCard"
import { MainLayout } from "@/components/layout/MainLayout"
import Link from "next/link"
import { Project } from "@prisma/client"
import { getProjects, PaginationParams } from "@/lib/api/project"
import { useOrganizationContext } from "@/contexts"


export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [totalProjects, setTotalProjects] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalPointsIssued, setTotalPointsIssued] = useState(0)

  const {currentOrganization} = useOrganizationContext()
  useEffect(() => {
    // Fetch projects when component mounts or search query changes
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const params: PaginationParams = {
          page: 1,
          pageSize: 6, // Show 6 most recent projects on the dashboard
          search: searchQuery,
          sortBy: 'updatedAt',
          sortOrder: 'desc'
        }
        
        const response = await getProjects(currentOrganization!.id,params)
        setProjects(response.data)
        setTotalProjects(response.meta.total)
        
        // Calculate stats from projects
        let customers = 0
        let points = 0
        
        // In a real app, you might have these aggregated values from the backend
        // This is just a placeholder calculation
        response.data.forEach(project => {
          // Define a proper type for project settings
          interface ProjectSettings {
            totalCustomers?: number;
            totalPointsIssued?: number;
            [key: string]: unknown;
          }
          
          // Assuming project.settings might contain these stats, adjust as needed
          const settings = (project.settings as ProjectSettings) || {}
          customers += settings.totalCustomers || 0
          points += settings.totalPointsIssued || 0
        })
        
        setTotalCustomers(customers)
        setTotalPointsIssued(points)
      } catch (error) {
        console.error('Error fetching projects:', error)
        // Fallback to empty projects
        setProjects([])
      } finally {
        setIsLoading(false)
      }
    }

    // Use a debounced fetch for search
    const debounceTimer = setTimeout(() => {
      fetchProjects()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

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
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Projects</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{totalProjects}</h3>
                  </div>
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                    <TrendingUp size={24} className="text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-500">
                  {projects.filter(p => p.status === 'live').length} active
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Customers</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {totalCustomers?.toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-secondary-100 dark:bg-secondary-900/30 p-3 rounded-lg">
                    <Users size={24} className="text-secondary-600 dark:text-secondary-400" />
                  </div>
                </div>
                {/* <div className="mt-2 text-sm text-green-500">+124 this week</div> */}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">Total Points Issued</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {totalPointsIssued?.toLocaleString()}
                    </h3>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <Award size={24} className="text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                {/* <div className="mt-2 text-sm text-green-500">+2,540 this week</div> */}
              </CardContent>
            </Card>
          </div>

          {/* Your Projects */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4 sm:mb-0">Your Projects</h2>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/projects" className="flex items-center">
                    View All
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <CircularProgress size={40} value={100}/>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                <CreateProjectCard />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
