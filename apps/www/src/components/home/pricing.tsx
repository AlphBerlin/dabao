"use client";

import { motion, useInView } from "framer-motion";
import { Button } from "@workspace/ui/components/button";
import { Check, Zap, X, HelpCircle } from "lucide-react";
import { fadeIn, staggerContainer, slideUp, textReveal, sectionEntrance } from "@/lib/animations";
import { useState, useRef, useEffect } from "react";
import { useGamify } from "@/hooks/use-gamify";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { Switch } from "@workspace/ui/components/switch";
import { Label } from "@workspace/ui/components/label";

const tiers = [
  {
    name: "Starter",
    price: { monthly: "Free", annual: "Free" },
    description: "Perfect for testing the waters",
    features: [
      { name: "Up to 100 customers", included: true },
      { name: "Basic reward templates", included: true },
      { name: "Standard support", included: true },
      { name: "Community access", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Remove branding", included: false }
    ],
    cta: "Start for free"
  },
  {
    name: "Growth",
    price: { monthly: "$49", annual: "$39" },
    description: "Scale your loyalty program",
    features: [
      { name: "Up to 10,000 customers", included: true },
      { name: "Custom reward rules", included: true },
      { name: "Priority support", included: true },
      { name: "API access", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Remove branding", included: true }
    ],
    popular: true,
    savings: "$120",
    cta: "Start 14-day trial"
  },
  {
    name: "Enterprise",
    price: { monthly: "Custom", annual: "Custom" },
    description: "For large-scale operations",
    features: [
      { name: "Unlimited customers", included: true },
      { name: "Custom integration", included: true },
      { name: "Dedicated support", included: true },
      { name: "SLA guarantee", included: true },
      { name: "Custom branding", included: true },
      { name: "Advanced security", included: true }
    ],
    cta: "Contact sales"
  }
];

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });
  const { incrementXP } = useGamify();
  
  // Update XP when user views pricing section
  useEffect(() => {
    if (isInView) {
      incrementXP(5);
    }
  }, [isInView, incrementXP]);

  return (
    <section ref={ref} id="pricing" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={sectionEntrance}
        className="container mx-auto px-6 relative z-10"
      >
        <div className="text-center mb-16">
          <motion.h2 
            variants={textReveal}
            className="text-4xl font-bold mb-4 satoshi-bold"
          >
            Simple, <span className="text-gradient">transparent</span> pricing
          </motion.h2>
          <motion.p 
            variants={slideUp}
            className="text-muted-foreground max-w-lg mx-auto mb-8"
          >
            Start free, scale as you grow. No hidden fees or complicated pricing structures.
            All plans include core features to get you started.
          </motion.p>
          
          {/* Billing toggle */}
          <motion.div 
            variants={fadeIn}
            className="flex items-center justify-center gap-3 mb-12"
          >
            <span className={`text-sm transition-colors ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <div className="flex items-center gap-2">
              <Switch 
                id="billing-toggle" 
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <Label htmlFor="billing-toggle">
                <span className={`text-sm transition-colors ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  Annual <span className="text-primary font-semibold text-xs">(Save 20%)</span>
                </span>
              </Label>
            </div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              custom={i}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: (i) => ({
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: i * 0.1,
                    duration: 0.5,
                    ease: [0.25, 0.1, 0.25, 1.0]
                  }
                })
              }}
              className={`glass rounded-xl p-8 border relative ${
                tier.popular ? "border-primary shadow-lg" : "border-primary/10"
              } transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full shadow-md">
                  Most Popular
                </span>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{isAnnual ? tier.price.annual : tier.price.monthly}</span>
                {tier.price.monthly !== "Custom" && <span className="text-muted-foreground">/month</span>}
                {tier.savings && isAnnual && (
                  <span className="text-sm text-primary ml-2 font-medium">
                    Save {tier.savings}/year
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-6">{tier.description}</p>
              
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-x-2">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground opacity-50" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
                    
                    {/* For enterprise features with info tooltips */}
                    {tier.name === "Enterprise" && ["SLA guarantee", "Custom branding", "Advanced security"].includes(feature.name) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground ml-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs w-48">
                              {feature.name === "SLA guarantee" && "99.9% uptime guarantee with financial compensation for any breaches"}
                              {feature.name === "Custom branding" && "Full white-labeling options for your brand identity"}
                              {feature.name === "Advanced security" && "SOC 2 compliance, data encryption, and regular security audits"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full glow-effect animate-all group"
                variant={tier.popular ? "default" : tier.name === "Enterprise" ? "outline" : "secondary"}
                size="lg"
              >
                {tier.cta}
                {tier.popular && <Zap className="ml-2 h-4 w-4 group-hover:animate-pulse" />}
              </Button>
            </motion.div>
          ))}
        </div>
        
        {/* Guarantee */}
        <motion.div 
          variants={fadeIn}
          className="text-center mt-16 max-w-2xl mx-auto"
        >
          <p className="text-muted-foreground text-sm">
            All plans come with a <span className="font-semibold text-primary">14-day money back guarantee</span>. 
            No credit card required for free trial. Cancel anytime.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}