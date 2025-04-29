import { Trophy } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import { cn } from "@workspace/ui/lib/utils"

export function Leaderboard() {
  const leaders = [
    {
      id: 1,
      rank: 1,
      user: {
        name: "Michael T.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MT",
      },
      points: 3250,
      isCurrentUser: false,
    },
    {
      id: 2,
      rank: 2,
      user: {
        name: "Sarah K.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "SK",
      },
      points: 2980,
      isCurrentUser: false,
    },
    {
      id: 3,
      rank: 3,
      user: {
        name: "Jordan D.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JD",
      },
      points: 1250,
      isCurrentUser: true,
    },
    {
      id: 4,
      rank: 4,
      user: {
        name: "Alex M.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "AM",
      },
      points: 980,
      isCurrentUser: false,
    },
    {
      id: 5,
      rank: 5,
      user: {
        name: "Taylor B.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "TB",
      },
      points: 750,
      isCurrentUser: false,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
        <CardDescription>Top members this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md",
                leader.isCurrentUser && "bg-secondary/50 font-medium",
              )}
            >
              <div className="w-5 text-center font-medium text-sm">{leader.rank}</div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={leader.user.avatar || "/placeholder.svg"} alt={leader.user.name} />
                <AvatarFallback>{leader.user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm">
                {leader.user.name}
                {leader.isCurrentUser && <span className="text-xs ml-1">(You)</span>}
              </div>
              <div className="font-medium text-sm">{leader.points}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
