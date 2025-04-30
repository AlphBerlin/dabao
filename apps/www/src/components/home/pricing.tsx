"use client";

import { motion } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { Check } from "lucide-react";
import { fadeIn, staggerContainer } from "@/lib/animations";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for testing the waters",
    features: [
      "Up to 100 customers",
      "Basic reward templates",
      "Standard support",
      "Community access"
    ]
  },
  {
    name: "Growth",
    price: "$49",
    description: "Scale your loyalty program",
    features: [
      "Up to 10,000 customers",
      "Custom reward rules",
      "Priority support",
      "API access",
      "Advanced analytics",
      "Remove branding"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale operations",
    features: [
      "Unlimited customers",
      "Custom integration",
      "Dedicated support",
      "SLA guarantee",
      "Custom branding",
      "Advanced security"
    ]
  }
];

export function Pricing() {
  return (
    <section className="py-24 relative">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="container mx-auto px-6"
      >
        <div className="text-center mb-16">
          <motion.h2 
            variants={fadeIn}
            className="text-4xl font-bold mb-4 satoshi-bold"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p 
            variants={fadeIn}
            className="text-muted-foreground"
          >
            Start free, scale as you grow
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={fadeIn}
              className={`glass rounded-xl p-8 relative ${
                tier.popular ? "border-primary" : ""
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{tier.price}</span>
                {tier.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
              </div>
              <p className="text-muted-foreground mb-6">{tier.description}</p>
              
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-x-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full"
                variant={tier.popular ? "default" : "secondary"}
              >
                Get started
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}