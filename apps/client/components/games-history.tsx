"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Trophy, Gift, Calendar, Sparkles } from "lucide-react"

export function GamesHistory() {
  // Sample game history data
  const gameHistory = [
    {
      id: "game-1",
      type: "Spin Wheel",
      date: "Today",
      prize: "50 Points",
      isWin: true,
    },
    {
      id: "game-2",
      type: "Lucky Slots",
      date: "Today",
      prize: "Try Again",
      isWin: false,
    },
    {
      id: "game-3",
      type: "Spin Wheel",
      date: "Yesterday",
      prize: "10% Off",
      isWin: true,
    },
    {
      id: "game-4",
      type: "Lucky Slots",
      date: "3 days ago",
      prize: "Try Again",
      isWin: false,
    },
    {
      id: "game-5",
      type: "Spin Wheel",
      date: "Last week",
      prize: "100 Points",
      isWin: true,
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-tn-blue flex items-center text-base">
            <Trophy className="h-4 w-4 mr-2 text-accent-teal" />
            Your Game Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gameHistory.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div
                  className={`p-2 rounded-full shrink-0 ${
                    game.isWin ? "bg-accent-teal/10 text-accent-teal" : "bg-gray-100 text-mid-gray"
                  }`}
                >
                  {game.isWin ? <Gift className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-tn-blue">{game.type}</h3>
                    <span className="text-xs text-mid-gray">{game.date}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-sm ${game.isWin ? "text-accent-teal font-medium" : "text-mid-gray"}`}>
                      {game.prize}
                    </span>
                    {game.isWin ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">Win</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Try Again
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-mid-gray">Total Wins</span>
              <span className="font-medium text-tn-blue">8</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-mid-gray">Points Earned</span>
              <span className="font-medium text-accent-teal">750</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="bg-tn-blue text-white p-4">
          <h3 className="font-medium mb-1">Upcoming Events</h3>
          <p className="text-xs text-white/80">Special games and limited-time prizes</p>
        </div>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-accent-teal/10 p-2 rounded-full">
                <Calendar className="h-4 w-4 text-accent-teal" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-tn-blue">Weekend Jackpot</h4>
                <p className="text-xs text-mid-gray">This Saturday - 1000 points prize pool</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-accent-teal/10 p-2 rounded-full">
                <Sparkles className="h-4 w-4 text-accent-teal" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-tn-blue">Mystery Game</h4>
                <p className="text-xs text-mid-gray">Coming next week - Exclusive rewards</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
