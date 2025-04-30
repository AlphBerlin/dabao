"use client";

import { GamifyProvider } from "@/hooks/use-gamify";
import { Navbar } from "@/components/home/navbar";
import { Hero } from "@/components/home/hero";
import { Demo } from "@/components/home/demo";
import { Testimonials } from "@/components/home/testimonials";
import { Pricing } from "@/components/home/pricing";
import { Footer } from "@/components/home/footer";

export default function Home() {
  return (
    <GamifyProvider>
      <main className="min-h-screen bg-background">
        <Navbar />
        <Hero />
        <Demo />
        <Testimonials />
        <Pricing />
        <Footer />
      </main>
    </GamifyProvider>
  );
}