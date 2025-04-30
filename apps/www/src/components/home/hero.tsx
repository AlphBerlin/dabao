"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { PlayCircle } from "lucide-react";
import { fadeIn, parallaxStar } from "@/lib/animations";

export function Hero() {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="relative min-h-screen flex items-center justify-center pt-20"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 noise" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            variants={parallaxStar}
            initial="initial"
            animate="animate"
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.h1
          variants={fadeIn}
          className="satoshi-bold text-5xl md:text-7xl mb-6 max-w-4xl mx-auto leading-tight"
        >
          Rewards that feel like a game,{" "}
          <span className="text-gradient">run themselves.</span>
        </motion.h1>

        <motion.p
          variants={fadeIn}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Dabao Rewards unifies loyalty, AI automation, and gamified UX so you
          engage customers in one click.
        </motion.p>

        <motion.div
          variants={fadeIn}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="min-w-[200px]">
            Get Started Free
          </Button>
          <Button size="lg" variant="secondary" className="min-w-[200px]">
            <PlayCircle className="mr-2 h-5 w-5" />
            See it in action
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}