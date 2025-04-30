"use client";

import { motion, useInView } from "framer-motion";
import { fadeIn, staggerContainer, slideUp, rotateIn, sectionEntrance, textReveal } from "@/lib/animations";
import { useEffect, useRef } from "react";
import { useGamify } from "@/hooks/use-gamify";
import { Award, Star } from "lucide-react";

const testimonials = [
  {
    quote: "Dabao Rewards transformed how we engage with customers. Our retention is up 40% since implementing the platform.",
    author: "Sarah Chen",
    role: "Head of Growth",
    company: "Urban Bites",
    image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200",
    rating: 5
  },
  {
    quote: "The gamification features are brilliant. Our customers love collecting points and completing quests. It's addictive!",
    author: "Michael Park",
    role: "CEO",
    company: "Sweet Box",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200",
    rating: 5
  },
  {
    quote: "The AI-powered campaign suggestions have saved us countless hours. It's like having a marketing team that works 24/7.",
    author: "Lisa Wong",
    role: "Marketing Director",
    company: "Fresh Daily",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200",
    rating: 5
  },
  {
    quote: "We've seen a 35% increase in repeat purchases since implementing Dabao's loyalty program. The ROI is outstanding.",
    author: "James Rodriguez",
    role: "Operations Manager",
    company: "Cafe Sunrise",
    image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200",
    rating: 4
  }
];

export function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const { updateAchievement, incrementXP } = useGamify();
  
  // Update achievement when user views testimonials
  useEffect(() => {
    if (isInView) {
      updateAchievement("quick_learner", 1);
      incrementXP(10); // Small XP reward for exploring the testimonials
    }
  }, [isInView, updateAchievement, incrementXP]);

  // Custom animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1.0]
      }
    })
  };

  return (
    <section ref={ref} className="py-24 relative overflow-hidden" id="testimonials">
      <div className="absolute inset-0 noise opacity-50" />
      
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={sectionEntrance}
        className="container mx-auto px-6 relative z-10"
      >
        <motion.div variants={textReveal} className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            variants={slideUp}
            className="text-4xl font-bold mb-4 satoshi-bold"
          >
            Loved by <span className="text-gradient">growing businesses</span>
          </motion.h2>
          
          <motion.p
            variants={slideUp}
            className="text-muted-foreground"
          >
            See how Dabao Rewards has helped businesses of all sizes transform their customer engagement and loyalty programs.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              custom={i}
              variants={cardVariants}
              className="glass rounded-xl p-8 shadow-lg border border-primary/5 transition-all duration-300 hover:shadow-xl hover:border-primary/10 hover:-translate-y-1"
            >
              {/* Rating */}
              <div className="flex mb-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star 
                    key={index}
                    className={`h-4 w-4 ${index < testimonial.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`}
                  />
                ))}
              </div>
              
              {/* Quote */}
              <blockquote className="text-muted-foreground mb-6 italic">
                "{testimonial.quote}"
              </blockquote>
              
              {/* Author info */}
              <div className="flex items-center gap-4 mt-auto">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/10"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Social proof metrics */}
        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center"
        >
          {[
            { value: "4.9/5", label: "Average Rating" },
            { value: "1,500+", label: "Active Businesses" },
            { value: "40%", label: "Average Retention Increase" },
            { value: "3.2M", label: "Rewards Delivered" }
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              variants={fadeIn}
              custom={i}
              className="glass p-6 rounded-lg"
            >
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}