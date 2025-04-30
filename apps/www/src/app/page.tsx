"use client";

import { GamifyProvider } from "@/hooks/use-gamify";
import { Navbar } from "@/components/home/navbar";
import { Hero } from "@/components/home/hero";
import { Demo } from "@/components/home/demo";
import { Testimonials } from "@/components/home/testimonials";
import { Pricing } from "@/components/home/pricing";
import { Footer } from "@/components/home/footer";
import { useEffect } from "react";

export default function Home() {
  // Enable smooth scrolling behavior
  useEffect(() => {
    // Add smooth scroll behavior to HTML element
    document.documentElement.style.scrollBehavior = "smooth";
    
    // Clean up on unmount
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <GamifyProvider>
      <main className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        
        {/* Create smooth scroll sections with IDs */}
        <section id="hero" className="scroll-mt-20">
          <Hero />
        </section>
        
        <section id="demo" className="scroll-mt-20">
          <Demo />
        </section>
        
        <section id="testimonials" className="scroll-mt-20">
          <Testimonials />
        </section>
        
        <section id="pricing" className="scroll-mt-20">
          <Pricing />
        </section>
        
        <Footer />
      </main>
    </GamifyProvider>
  );
}