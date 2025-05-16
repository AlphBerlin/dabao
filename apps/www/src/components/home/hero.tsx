"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { PlayCircle, ChevronDown } from "lucide-react";
import { fadeIn, slideUp, bounce, scrollToSection } from "@/lib/animations";
import { useEffect, useState, useMemo } from "react";

// Generate stars data outside of component render
const generateStarsData = (count: number) => {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    opacity: Math.random() * 0.5 + 0.2,
    width: `${Math.random() * 3 + 1}px`,
    height: `${Math.random() * 3 + 1}px`,
  }));
};

export function Hero() {
  // Scroll to the next section when clicking the chevron
  const handleScrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection("demo");
  };

  return (
    <motion.section
      initial="hidden"
      animate="visible" // Always use "visible" to match server rendering
      variants={fadeIn}
      className="relative min-h-screen flex items-center justify-center pt-20"
    >
    

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.h1
          variants={slideUp}
          className="satoshi-bold text-5xl md:text-7xl mb-6 max-w-4xl mx-auto leading-tight"
        >
          Rewards that feel like a game,{" "}
          <span className="text-gradient glow-effect">run themselves.</span>
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Dabao Rewards unifies loyalty, AI automation, and gamified UX so you
          engage customers in one click.
        </motion.p>

        <motion.div
          variants={slideUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button size="lg" className="min-w-[200px] glow-effect animate-all">
            Get Started Free
          </Button>
          <Button size="lg" variant="secondary" className="min-w-[200px] animate-all">
            <PlayCircle className="mr-2 h-5 w-5" />
            See it in action
          </Button>
        </motion.div>
        
        {/* Scroll indicator - improved positioning and alignment */}
        
      </div>
      <motion.div 
          variants={bounce}
          initial="hidden"
          animate="animate"
          className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer animate-all"
          style={{ bottom: "5vh" }}
          onClick={handleScrollToDemo}
        >
          <a href="#demo" className="flex flex-col items-center gap-1 py-2 px-4 rounded-full hover:bg-secondary/20 transition-all">
            <span className="text-sm font-medium">Discover more</span>
            <ChevronDown className="h-5 w-5" />
          </a>
        </motion.div>
    </motion.section>
  );
}