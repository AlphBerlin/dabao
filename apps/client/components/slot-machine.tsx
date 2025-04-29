"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Coins } from "lucide-react"
import { useToast } from "@workspace/ui/hooks/use-toast"

interface SlotMachineProps {
  onWin: () => void
}

export function SlotMachine({ onWin }: SlotMachineProps) {
  const { toast } = useToast()
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState<number[]>([0, 0, 0])
  const [result, setResult] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)

  // Slot symbols - in a real app, these would be images
  const symbols = [
    { symbol: "🎁", label: "Gift" },
    { symbol: "💎", label: "Diamond" },
    { symbol: "🌟", label: "Star" },
    { symbol: "🍒", label: "Cherry" },
    { symbol: "🔔", label: "Bell" },
    { symbol: "7️⃣", label: "Seven" },
  ]

  // Win combinations and their rewards
  const winCombinations = [
    { combination: [0, 0, 0], reward: "500 Points", probability: 0.01 },
    { combination: [1, 1, 1], reward: "200 Points", probability: 0.03 },
    { combination: [2, 2, 2], reward: "100 Points", probability: 0.05 },
    { combination: [3, 3, 3], reward: "50 Points", probability: 0.1 },
    { combination: [4, 4, 4], reward: "10% Off", probability: 0.05 },
    { combination: [5, 5, 5], reward: "Free Shipping", probability: 0.05 },
  ]

  // Function to determine the result based on probabilities
  const determineResult = () => {
    // In a real app, this would be controlled by the backend
    // to prevent client-side manipulation
    const rand = Math.random()

    // Check if we hit any winning combination based on probability
    let cumulativeProbability = 0
    for (const win of winCombinations) {
      cumulativeProbability += win.probability
      if (rand <= cumulativeProbability) {
        return win.combination
      }
    }

    // If no win, generate random non-winning combination
    let randomReels
    do {
      randomReels = [
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
      ]
      // Make sure it's not accidentally a winning combination
    } while (
      winCombinations.some(
        (win) =>
          win.combination[0] === randomReels[0] &&
          win.combination[1] === randomReels[1] &&
          win.combination[2] === randomReels[2],
      )
    )

    return randomReels
  }

  const spinSlots = () => {
    if (isSpinning || tokensUsed >= 5) return

    setIsSpinning(true)
    setResult(null)

    // Determine the final result
    const finalResult = determineResult()

    // Animate the reels
    const spinDuration = 2000 // 2 seconds
    const reelDelay = 300 // 300ms between each reel stopping

    // Start with random spinning
    const spinInterval = setInterval(() => {
      setReels([
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
      ])
    }, 100)

    // Stop each reel in sequence
    setTimeout(
      () => {
        clearInterval(spinInterval)
        setReels((prev) => [finalResult[0], prev[1], prev[2]])

        setTimeout(() => {
          setReels((prev) => [prev[0], finalResult[1], prev[2]])

          setTimeout(() => {
            setReels([finalResult[0], finalResult[1], finalResult[2]])
            setIsSpinning(false)

            // Check if it's a winning combination
            const winningCombo = winCombinations.find(
              (win) =>
                win.combination[0] === finalResult[0] &&
                win.combination[1] === finalResult[1] &&
                win.combination[2] === finalResult[2],
            )

            if (winningCombo) {
              setResult(winningCombo.reward)
              onWin()
              toast({
                title: "Jackpot! 🎉",
                description: `You won ${winningCombo.reward}!`,
              })
            } else {
              setResult("Try Again")
              toast({
                title: "Almost there!",
                description: "Try again for a chance to win big!",
              })
            }

            // Update tokens used
            setTokensUsed((prev) => prev + 1)
          }, reelDelay)
        }, reelDelay)
      },
      spinDuration - reelDelay * 2,
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md mx-auto mb-8">
        <Card className="bg-tn-blue p-6 rounded-lg shadow-lg">
          {/* Slot machine display */}
          <div className="flex justify-center gap-2 mb-6">
            {reels.map((reelValue, index) => (
              <motion.div
                key={index}
                className="w-20 h-24 bg-white rounded-lg flex items-center justify-center shadow-inner"
                initial={{ y: 0 }}
                animate={isSpinning && index === 0 ? { y: [0, -20, 20, 0] } : {}}
                transition={{ repeat: isSpinning ? Number.POSITIVE_INFINITY : 0, duration: 0.2 }}
              >
                <span className="text-4xl">{symbols[reelValue].symbol}</span>
              </motion.div>
            ))}
          </div>

          {/* Win line */}
          <div className="h-1 bg-accent-teal w-full mb-4"></div>

          {/* Slot machine controls */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 rounded-full bg-red-500 border-4 border-red-600 shadow-lg flex items-center justify-center disabled:opacity-50"
              onClick={spinSlots}
              disabled={isSpinning || tokensUsed >= 5}
            >
              <span className="text-white font-bold">SPIN</span>
            </motion.button>
          </div>
        </Card>
      </div>

      {/* Controls and results */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        {result && (
          <Card
            className={`w-full p-4 text-center ${result !== "Try Again" ? "bg-accent-teal/10 border-accent-teal/20" : "bg-gray-50 border-gray-200"}`}
          >
            <p
              className="text-lg font-bold mb-1"
              className={result !== "Try Again" ? "text-accent-teal" : "text-mid-gray"}
            >
              {result !== "Try Again" ? "Jackpot!" : "Almost there!"}
            </p>
            <p className="text-mid-gray">
              {result !== "Try Again" ? `You won ${result}!` : "Try again for a chance to win big!"}
            </p>
          </Card>
        )}

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-mid-gray">
              Tokens: <span className="font-medium">{5 - tokensUsed}/5</span> remaining
            </span>
          </div>

          <Badge variant="outline" className="bg-accent-teal/5 text-accent-teal border-accent-teal/20">
            1 token per spin
          </Badge>
        </div>

        <Button
          onClick={spinSlots}
          disabled={isSpinning || tokensUsed >= 5}
          className="w-full bg-accent-teal hover:bg-accent-teal/90 text-white"
        >
          {isSpinning ? "Spinning..." : "Spin the Slots"}
        </Button>

        {tokensUsed >= 5 && (
          <p className="text-sm text-mid-gray text-center">
            You've used all your tokens for today. Come back tomorrow for more spins!
          </p>
        )}
      </div>
    </div>
  )
}
