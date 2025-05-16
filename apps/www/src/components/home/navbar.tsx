"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { useGamify } from "@/hooks/use-gamify";
import Link from "next/link";
import { fadeIn, slideIn } from "@/lib/animations";
import { useAuth } from "@workspace/auth/contexts/auth-context";
import { useEffect, useState } from "react";

export function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const { xp, level, progress, badges } = useGamify();

  // Handle scroll event for navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-lg bg-background/70" : "bg-transparent"
      }`}
    >
      <nav className={`mx-auto px-6 py-4 ${scrolled ? "shadow-sm" : ""}`}>
        <div className="container mx-auto flex items-center justify-between">
          <motion.div variants={slideIn} className="flex items-center gap-x-8">
            <Link href="/" className="text-2xl font-bold text-gradient glow-effect">
              Dabao
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <a 
                href="#hero" 
                onClick={scrollToSection("hero")}
                className="text-sm text-muted-foreground hover:text-primary transition animate-all"
              >
                Home
              </a>
              <a 
                href="#demo" 
                onClick={scrollToSection("demo")}
                className="text-sm text-muted-foreground hover:text-primary transition animate-all"
              >
                Features
              </a>
              <a 
                href="#testimonials" 
                onClick={scrollToSection("testimonials")}
                className="text-sm text-muted-foreground hover:text-primary transition animate-all"
              >
                Testimonials
              </a>
              <a 
                href="#pricing" 
                onClick={scrollToSection("pricing")}
                className="text-sm text-muted-foreground hover:text-primary transition animate-all"
              >
                Pricing
              </a>
            </div>
          </motion.div>

          <motion.div variants={slideIn} className="flex items-center gap-x-4">
            {/* Gamification UI */}
      
            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="glow-effect">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="animate-all">
                    Login
                  </Button>
                </Link>

                <Link href="/auth/signup">
                  <Button size="sm" className="glow-effect animate-all">
                    Get Started →
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </nav>
    </motion.header>
  );
}