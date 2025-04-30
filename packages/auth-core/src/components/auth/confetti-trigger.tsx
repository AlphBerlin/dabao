"use client"

import { useEffect, useRef } from "react"
import { motion, useAnimate } from "framer-motion"

type ConfettiTriggerProps = {
  isActive: boolean
  onComplete?: () => void
}

export function ConfettiTrigger({ isActive, onComplete }: ConfettiTriggerProps) {
  const [scope, animate] = useAnimate()
  const particlesRef = useRef<HTMLDivElement>(null)
  const particleCount = 100

  useEffect(() => {
    if (isActive && particlesRef.current) {
      // Create and animate particles
      const particles = Array.from({ length: particleCount }).map((_, i) => {
        const particle = document.createElement("div")
        particle.className = "absolute w-2 h-2 rounded-full"

        // Randomize colors
        const colors = ["bg-primary", "bg-secondary", "bg-blue-400", "bg-green-400", "bg-yellow-400", "bg-pink-400"]
        particle.classList.add(colors[Math.floor(Math.random() * colors.length)])

        particlesRef.current?.appendChild(particle)
        return particle
      })

      // Animate each particle
      const animations = particles.map((particle, i) => {
        // Random position and angle
        const angle = Math.random() * Math.PI * 2
        const radius = 100 + Math.random() * 200
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        return animate(
          particle,
          [
            { opacity: 1, x: 0, y: 0, scale: 0 },
            { opacity: 1, x, y, scale: 1 + Math.random() },
            { opacity: 0, x: x * 1.5, y: y * 1.5, scale: 0 },
          ],
          {
            duration: 1.5 + Math.random(),
            ease: [0.22, 1, 0.36, 1],
            delay: i * 0.01,
            onComplete:
              i === particles.length - 1
                ? () => {
                    // Clean up particles
                    particles.forEach((p) => p.remove())
                    onComplete?.()
                  }
                : undefined,
          },
        )
      })

      return () => {
        // Clean up animations if component unmounts during animation
        animations.forEach((animation) => animation.cancel())
        particles.forEach((p) => p.remove())
      }
    }
  }, [isActive, animate, onComplete])

  return (
    <motion.div ref={scope} className="absolute inset-0 pointer-events-none overflow-hidden">
      <div ref={particlesRef} className="relative w-full h-full" />
    </motion.div>
  )
}
