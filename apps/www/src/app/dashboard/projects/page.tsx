"use client";

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectCard } from "@/components/projects/CreateProjectCard";
import { getProjects, PaginationParams, PaginatedResponse } from "@/lib/api/project";
import { Project } from "@prisma/client";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { CircularProgress } from "@workspace/ui/components/CircularProgress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@workspace/ui/components/pagination";
import Link from "next/link";

export default function ProjectsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProjects, setTotalProjects] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(9);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterOpen, setFilterOpen] = useState<boolean>(false);

  // Load projects whenever filters or pagination changes
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const params: PaginationParams = {
          page: currentPage,
          pageSize,
          search: searchQuery,
          status: statusFilter || undefined,
          sortBy,
          sortOrder,
        };

        const response: PaginatedResponse<Project> = await getProjects(params);
        setProjects(response.data);
        setTotalPages(response.meta.totalPages);
        setTotalProjects(response.meta.total);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search queries
    const debounceTimer = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, pageSize, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show
    
    // Always show first page
    items.push(
      <PaginationItem key="first">
        <Button
          variant={currentPage === 1 ? "default" : "outline"}
          size="icon"
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
        >
          1
        </Button>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationEllipsis key="ellipsis-start" />
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i <= 1 || i >= totalPages) continue; // Skip first and last page as they're always shown
      
      items.push(
        <PaginationItem key={i}>
          <Button
            variant={currentPage === i ? "default" : "outline"}
            size="icon"
            onClick={() => goToPage(i)}
          >
            {i}
          </Button>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationEllipsis key="ellipsis-end" />
      );
    }
    
    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="icon"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            {totalPages}
          </Button>
        </PaginationItem>
      );
    }
    
    return items;
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSortBy("updatedAt");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Projects
              </h1>
              <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                Manage all your loyalty programs
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <Card className="mb-8">
            <CardHeader className="pb-0">
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span>Find Projects</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Search and filter through your loyalty programs
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                      placeholder="Search by name or description..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                    />
                  </div>

                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">All Status</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col md:flex-row gap-4 pt-4 border-t"
                  >
                    <div className="flex-grow space-y-2">
                      <p className="text-sm font-medium">Sort By</p>
                      <div className="flex gap-2">
                        <Select
                          value={sortBy}
                          onValueChange={(value) => {
                            setSortBy(value);
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="updatedAt">Last Updated</SelectItem>
                            <SelectItem value="createdAt">Creation Date</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={sortOrder}
                          onValueChange={(value: "asc" | "desc") => {
                            setSortOrder(value);
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex-grow space-y-2">
                      <p className="text-sm font-medium">Results Per Page</p>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => {
                          setPageSize(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" onClick={handleReset}>
                        Reset Filters
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results info */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Showing{" "}
              <span className="font-medium text-neutral-900 dark:text-white">
                {projects.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-neutral-900 dark:text-white">
                {totalProjects}
              </span>{" "}
              projects
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex justify-center p-12">
              <CircularProgress size={40} value={100} />
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
              <CreateProjectCard />
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800 mb-4">
                  <Filter className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold">No projects found</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1 mb-4 max-w-md">
                  {searchQuery || statusFilter
                    ? "Try adjusting your search or filter to find what you're looking for"
                    : "Create your first loyalty program to get started"}
                </p>
                {searchQuery || statusFilter ? (
                  <Button variant="outline" onClick={handleReset}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/dashboard/projects/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Project
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
