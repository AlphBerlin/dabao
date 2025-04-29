export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "pending" | "completed" | "archived"
  progress: number
  teamSize: number
  createdAt: string
  updatedAt: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  points: number
  category: string
  status: "completed" | "in-progress" | "locked"
  progress: number
  completedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "user"
  avatar?: string
  createdAt: string
}
