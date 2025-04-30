"use client";

import { motion } from "framer-motion";
import { fadeIn, staggerContainer } from "@/lib/animations";

const testimonials = [
  {
    quote: "Dabao Rewards transformed how we engage with customers. Our retention is up 40% since implementing the platform.",
    author: "Sarah Chen",
    role: "Head of Growth",
    company: "Urban Bites",
    image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200"
  },
  {
    quote: "The gamification features are brilliant. Our customers love collecting points and completing quests. It's addictive!",
    author: "Michael Park",
    role: "CEO",
    company: "Sweet Box",
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200"
  },
  {
    quote: "The AI-powered campaign suggestions have saved us countless hours. It's like having a marketing team that works 24/7.",
    author: "Lisa Wong",
    role: "Marketing Director",
    company: "Fresh Daily",
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 relative">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="container mx-auto px-6"
      >
        <motion.h2 
          variants={fadeIn}
          className="text-4xl font-bold text-center mb-16 satoshi-bold"
        >
          Loved by growing businesses
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.author}
              variants={fadeIn}
              className="glass rounded-xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
              <blockquote className="text-muted-foreground">
                "{testimonial.quote}"
              </blockquote>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}