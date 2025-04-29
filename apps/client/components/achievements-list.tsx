import { Award, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export function AchievementsList() {
  const achievements = [
    {
      id: 1,
      title: "First Purchase",
      description: "Make your first purchase",
      icon: "/placeholder.svg?height=40&width=40",
      isCompleted: true,
      reward: 50,
    },
    {
      id: 2,
      title: "Profile Completed",
      description: "Fill out your profile information",
      icon: "/placeholder.svg?height=40&width=40",
      isCompleted: true,
      reward: 50,
    },
    {
      id: 3,
      title: "Social Sharer",
      description: "Share a product on social media",
      icon: "/placeholder.svg?height=40&width=40",
      isCompleted: true,
      reward: 25,
    },
    {
      id: 4,
      title: "Review Master",
      description: "Write 5 product reviews",
      icon: "/placeholder.svg?height=40&width=40",
      isCompleted: false,
      progress: 3,
      total: 5,
      reward: 100,
    },
    {
      id: 5,
      title: "Loyal Customer",
      description: "Make 10 purchases",
      icon: "/placeholder.svg?height=40&width=40",
      isCompleted: false,
      progress: 2,
      total: 10,
      reward: 200,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Unlock badges and earn bonus points</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            View All <span className="text-xs rounded-full bg-muted px-2 py-0.5 ml-1">12</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.slice(0, 3).map((achievement) => (
            <div
              key={achievement.id}
              className={cn(
                "border rounded-lg p-4 flex items-start gap-3 transition-all hover:shadow-sm",
                achievement.isCompleted ? "bg-secondary/30" : "",
              )}
            >
              <div className="relative h-10 w-10 shrink-0">
                <img src={achievement.icon || "/placeholder.svg"} alt="" className="h-full w-full object-contain" />
                {achievement.isCompleted && (
                  <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-primary" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-medium text-sm">{achievement.title}</h3>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>

                <div className="mt-2 flex items-center text-xs">
                  {achievement.isCompleted ? (
                    <span className="text-primary font-medium">Completed</span>
                  ) : (
                    <span>
                      {achievement.progress}/{achievement.total} completed
                    </span>
                  )}
                  <div className="ml-auto flex items-center">
                    <Award className="h-3 w-3 mr-1 text-primary" />
                    {achievement.reward} pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
