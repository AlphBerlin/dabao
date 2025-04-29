import { Clock, Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

export function ChallengesList() {
  const challenges = [
    {
      id: 1,
      title: "Summer Shopping Spree",
      description: "Make 3 purchases this month",
      progress: 66,
      current: 2,
      total: 3,
      reward: 200,
      timeLeft: "15 days",
      isNew: true,
    },
    {
      id: 2,
      title: "Social Butterfly",
      description: "Share 5 products on social media",
      progress: 40,
      current: 2,
      total: 5,
      reward: 150,
      timeLeft: "Ongoing",
      isNew: false,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Challenges</CardTitle>
            <CardDescription>Complete challenges to earn bonus points</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            View All <span className="text-xs rounded-full bg-muted px-2 py-0.5 ml-1">5</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{challenge.title}</h3>
                    {challenge.isNew && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                <div className="flex items-center text-sm font-medium">
                  <Trophy className="h-4 w-4 mr-1 text-primary" />
                  {challenge.reward} pts
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Progress: {challenge.current}/{challenge.total}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {challenge.timeLeft}
                  </span>
                </div>
                <Progress value={challenge.progress} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
