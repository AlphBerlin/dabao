"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Award, Users, Star, Globe, Trophy, CheckCircle } from "lucide-react"
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import dynamic from "next/dynamic"

// Dynamically import ReactConfetti with no SSR
const ReactConfetti = dynamic(() => import("react-confetti"), { ssr: false })

interface Achievement {
  id: string
  title: string
  description: string
  icon?: "users" | "award" | "star" | "globe" | "trophy"
  progress?: number
  total?: number
  earned: boolean
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  const getIcon = () => {
    switch (achievement.icon) {
      case "users":
        return <Users size={24} />
      case "award":
        return <Award size={24} />
      case "star":
        return <Star size={24} />
      case "globe":
        return <Globe size={24} />
      case "trophy":
        return <Trophy size={24} />
      default:
        return <Award size={24} />
    }
  }

  const handleClick = () => {
    if (achievement.earned) {
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
      }, 3000)
    }
  }

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <ReactConfetti
            recycle={false}
            numberOfPieces={500}
            gravity={0.15}
            colors={["#1ABC9C", "#9B59B6", "#3498DB", "#F1C40F", "#E74C3C"]}
          />
        </div>
      )}

      <Card
        className={`h-full hover:shadow-md transition-shadow cursor-pointer ${!achievement.earned ? "opacity-60" : ""}`}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start">
            <div
              className={`
                h-12 w-12 rounded-full flex items-center justify-center mr-4
                ${
                  achievement.earned
                    ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                    : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                }
              `}
            >
              {getIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900 dark:text-white">{achievement.title}</h3>
                {achievement.earned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 10,
                    }}
                  >
                    <CheckCircle size={16} className="text-green-500" />
                  </motion.div>
                )}
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{achievement.description}</p>

              {achievement.progress !== undefined && achievement.total !== undefined && (
                <div className="mt-3">
                  <Progress
                    value={(achievement.progress / achievement.total) * 100}
                    className={`h-2 ${achievement.earned ? "bg-green-100" : "bg-neutral-100"}`}
                  />
                  <div className="flex justify-between mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    <span>{achievement.progress.toLocaleString()}</span>
                    <span>{achievement.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-3 text-xs">
          {achievement.earned ? (
            <span className="text-green-600">Completed</span>
          ) : (
            <span className="text-muted-foreground">
              {achievement.progress && achievement.total
                ? `${Math.round((achievement.progress / achievement.total) * 100)}% complete`
                : "In progress"}
            </span>
          )}
        </CardFooter>
      </Card>
    </>
  )
}
