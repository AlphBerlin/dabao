"use client"

import { useState, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { CreateProjectCard } from "@/components/projects/CreateProjectCard"
import { MainLayout } from "@/components/layout/MainLayout"
import { CircularProgress } from "@workspace/ui/components/CircularProgress"
import { Search, Plus } from "lucide-react"
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
  {
    id: "proj-4",
    name: "Restaurant Rewards",
    status: "live",
    domain: "restaurant-rewards.app",
    stats: {
      customers: 876,
      pointsIssued: 32450,
    },
  },
  {
    id: "proj-5",
    name: "Spa Loyalty",
    status: "paused",
    domain: "spa-loyalty.app",
    stats: {
      customers: 124,
      pointsIssued: 5670,
    },
  },
]

export default function ProjectsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState(mockProjects)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = mockProjects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredProjects(filtered)
    } else {
      setFilteredProjects(mockProjects)
    }
  }, [searchQuery])

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Projects</h1>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" /> New Project
              </Link>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <CircularProgress size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            <CreateProjectCard />
          </div>
        )}

        {filteredProjects.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or create a new project.</p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" /> Create New Project
              </Link>
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
