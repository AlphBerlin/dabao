export {type Project} from "@prisma/client"

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

