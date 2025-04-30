"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { useGamify } from "@/hooks/use-gamify";
import { ApertureIcon as TreasureIcon } from "lucide-react";
import Link from "next/link";
import { fadeIn, slideIn } from "@/lib/animations";

export function Navbar() {
  const { xp, level } = useGamify();
  const progress = (xp % 1000) / 10; // Convert to percentage

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <nav className="glass mx-auto px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <motion.div variants={slideIn} className="flex items-center gap-x-8">
            <Link href="/" className="text-2xl font-bold text-gradient">
              Dabao
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-primary transition">
                Pricing
              </Link>
            </div>
          </motion.div>

          <motion.div variants={slideIn} className="flex items-center gap-x-4">
            <div className="hidden md:flex items-center gap-x-2 bg-secondary/50 px-3 py-1.5 rounded-full">
              <span className="text-xs font-medium">Level {level}</span>
              <Progress value={progress} className="w-20 h-2" />
            </div>
            
            <Link href="/pricing">
              <Button variant="ghost" size="icon" className="relative">
                <TreasureIcon className="w-5 h-5 text-primary animate-pulse" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              </Button>
            </Link>

            <Link href="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
            
            <Link href="/signup">
              <Button size="sm">Get Started →</Button>
            </Link>
          </motion.div>
        </div>
      </nav>
    </motion.header>
  );
}