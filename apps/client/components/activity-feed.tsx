import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      user: {
        name: "Sarah K.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "SK",
      },
      action: "reached Gold level",
      time: "2 minutes ago",
    },
    {
      id: 2,
      user: {
        name: "Michael T.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "MT",
      },
      action: "redeemed Free Shipping reward",
      time: "15 minutes ago",
    },
    {
      id: 3,
      user: {
        name: "Jessica L.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "JL",
      },
      action: "completed Summer Challenge",
      time: "1 hour ago",
    },
    {
      id: 4,
      user: {
        name: "David W.",
        avatar: "/placeholder.svg?height=40&width=40",
        initials: "DW",
      },
      action: "earned Social Sharer badge",
      time: "3 hours ago",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Community Activity</CardTitle>
        <CardDescription>See what other members are doing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span> {activity.action}
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
