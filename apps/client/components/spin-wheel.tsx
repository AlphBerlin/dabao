"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Sparkles, Coins } from "lucide-react"
import { useToast } from "@workspace/ui/hooks/use-toast"

interface SpinWheelProps {
  onWin: () => void
}

export function SpinWheel({ onWin }: SpinWheelProps) {
  const { toast } = useToast()
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const wheelRef = useRef<HTMLDivElement>(null)

  // Wheel segments - in a real app, this would come from an API
  const segments = [
    { label: "50 Points", color: "#0033A0", textColor: "white", probability: 0.2, isWin: true },
    { label: "Try Again", color: "#f3f4f6", textColor: "#6C757D", probability: 0.3, isWin: false },
    { label: "100 Points", color: "#17A2B8", textColor: "white", probability: 0.15, isWin: true },
    { label: "Try Again", color: "#f3f4f6", textColor: "#6C757D", probability: 0.2, isWin: false },
    { label: "200 Points", color: "#0033A0", textColor: "white", probability: 0.05, isWin: true },
    { label: "10% Off", color: "#17A2B8", textColor: "white", probability: 0.05, isWin: true },
    { label: "Try Again", color: "#f3f4f6", textColor: "#6C757D", probability: 0.04, isWin: false },
    { label: "500 Points", color: "#0033A0", textColor: "white", probability: 0.01, isWin: true },
  ]

  const totalSegments = segments.length
  const segmentAngle = 360 / totalSegments

  // Function to determine the winning segment based on probabilities
  const determineWinningSegment = () => {
    // In a real app, this would be controlled by the backend
    // to prevent client-side manipulation
    const rand = Math.random()
    let cumulativeProbability = 0

    for (let i = 0; i < segments.length; i++) {
      cumulativeProbability += segments[i].probability
      if (rand <= cumulativeProbability) {
        return i
      }
    }

    return 0 // Default to first segment if something goes wrong
  }

  const spinWheel = () => {
    if (isSpinning || tokensUsed >= 5) return

    setIsSpinning(true)
    setResult(null)

    // Determine winning segment
    const winningSegmentIndex = determineWinningSegment()

    // Calculate the rotation to land on the winning segment
    // We add 5 full rotations (1800 degrees) plus the offset to the winning segment
    const targetRotation = 1800 + (360 - winningSegmentIndex * segmentAngle)

    // Set the new rotation value
    setRotation((prevRotation) => prevRotation + targetRotation)

    // Update tokens used
    setTokensUsed((prev) => prev + 1)

    // After the animation completes, show the result
    setTimeout(() => {
      setIsSpinning(false)
      const winningSegment = segments[winningSegmentIndex]
      setResult(winningSegment.label)

      if (winningSegment.isWin) {
        onWin()
        toast({
          title: "Congratulations! 🎉",
          description: `You won ${winningSegment.label}!`,
        })
      } else {
        toast({
          title: "Better luck next time!",
          description: "Spin again for another chance to win.",
        })
      }
    }, 5000) // Match this with the CSS animation duration
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-md mx-auto mb-8">
        {/* Wheel marker/pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-b-[30px] border-b-red-500"></div>

        {/* Wheel container */}
        <div className="relative aspect-square">
          {/* Spinning wheel */}
          <motion.div
            ref={wheelRef}
            className="w-full h-full rounded-full overflow-hidden border-8 border-gray-200 shadow-lg"
            style={{
              transformOrigin: "center",
              transition: isSpinning ? "transform 5s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none",
            }}
            animate={{ rotate: rotation }}
          >
            {segments.map((segment, index) => (
              <div
                key={index}
                className="absolute top-0 left-0 w-full h-full flex items-start justify-center"
                style={{
                  transform: `rotate(${index * segmentAngle}deg)`,
                  transformOrigin: "center",
                }}
              >
                <div
                  className="w-1/2 h-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: segment.color,
                    transformOrigin: "right center",
                    transform: "skewY(30deg)",
                  }}
                >
                  <div
                    className="text-xs font-bold rotate-90 whitespace-nowrap"
                    style={{ color: segment.textColor, marginRight: "-50%" }}
                  >
                    {segment.label}
                  </div>
                </div>
              </div>
            ))}

            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent-teal flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        {result && (
          <Card className="w-full bg-accent-teal/10 border-accent-teal/20 p-4 text-center">
            <p className="text-lg font-bold text-accent-teal mb-1">
              {segments.find((s) => s.label === result)?.isWin ? "Congratulations!" : "Better luck next time!"}
            </p>
            <p className="text-mid-gray">
              {segments.find((s) => s.label === result)?.isWin
                ? `You won ${result}!`
                : "Spin again for another chance to win."}
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
          onClick={spinWheel}
          disabled={isSpinning || tokensUsed >= 5}
          className="w-full bg-accent-teal hover:bg-accent-teal/90 text-white"
        >
          {isSpinning ? "Spinning..." : "Spin the Wheel"}
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
