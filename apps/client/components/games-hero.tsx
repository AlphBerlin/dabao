"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Sparkles, Trophy, Gift, Coins } from "lucide-react"

export function GamesHero() {
  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <CardContent className="p-0">
        <div className="relative bg-gradient-to-r from-tn-blue to-accent-teal text-white p-6 sm:p-8">
          {/* Decorative elements */}
          <motion.div
            className="absolute top-0 right-0 w-64 h-64 opacity-10"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full border-8 border-white"></div>
          </motion.div>

          <motion.div
            className="absolute bottom-4 right-8 text-white opacity-10"
            initial={{ y: 0 }}
            animate={{ y: -10 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse", ease: "easeInOut" }}
          >
            <Trophy size={80} />
          </motion.div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Fun & Games</h1>
            </div>

            <p className="text-white/80 max-w-2xl mb-6">
              Play exciting games for a chance to win bonus points and exclusive rewards! Use your daily tokens or spend
              points to play more.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-300" />
                <div>
                  <div className="text-sm text-white/80">Available Tokens</div>
                  <div className="text-xl font-bold">3 / 5</div>
                </div>
              </div>

              <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-300" />
                <div>
                  <div className="text-sm text-white/80">Prizes Won</div>
                  <div className="text-xl font-bold">12</div>
                </div>
              </div>

              <div className="ml-auto">
                <Button className="bg-white text-tn-blue hover:bg-white/90">
                  <Trophy className="h-4 w-4 mr-2" />
                  View Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
