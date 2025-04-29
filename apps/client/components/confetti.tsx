"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"

export function Confetti() {
  const [instance, setInstance] = useState<confetti.CreateTypes | null>(null)

  useEffect(() => {
    // Create a canvas element
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "100"
    document.body.appendChild(canvas)

    // Create confetti instance
    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })

    setInstance(myConfetti)

    // Fire confetti
    const colors = ["#0033A0", "#17A2B8", "#6C757D"]

    myConfetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
    })

    const interval = setInterval(() => {
      myConfetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      })
    }, 1000)

    // Clean up
    return () => {
      clearInterval(interval)
      document.body.removeChild(canvas)
    }
  }, [])

  return null
}
