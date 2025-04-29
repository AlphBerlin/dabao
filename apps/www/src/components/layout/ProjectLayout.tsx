"use client"

import type React from "react"

import { useParams } from "next/navigation"
import { Sidebar } from "./Sidebar"

interface ProjectLayoutProps {
  children: React.ReactNode
}

export function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams()
  const projectId = (params.projectId as string) || ""

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Sidebar projectId={projectId} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
