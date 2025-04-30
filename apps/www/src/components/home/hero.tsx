"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { PlayCircle, ChevronDown } from "lucide-react";
import { fadeIn, parallaxStar, slideUp, bounce, scrollToSection } from "@/lib/animations";
import { useEffect, useState } from "react";

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animations when component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Scroll to the next section when clicking the chevron
  const handleScrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection("demo");
  };

  return (
    <motion.section
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
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
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }}
          />
        ))}
      </div>

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
        
        {/* Scroll indicator */}
        <motion.div 
          variants={bounce}
          initial="hidden"
          animate="animate"
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer animate-all"
          onClick={handleScrollToDemo}
        >
          <a href="#demo" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
            <span className="text-sm mb-2">Discover more</span>
            <ChevronDown className="h-6 w-6" />
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
}