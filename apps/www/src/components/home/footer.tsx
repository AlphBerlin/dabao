"use client";

import { motion } from "framer-motion";
import { fadeIn, slideUp, staggerContainer } from "@/lib/animations";
import Link from "next/link";
import { Github, Twitter, Linkedin, Mail, ArrowRight, ChevronUp } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { useGamify } from "@/hooks/use-gamify";
import { scrollToSection } from "@/lib/animations";

const footerLinks = {
  product: [
    { label: "Features", href: "#demo" },
    { label: "Pricing", href: "#pricing" },
    { label: "Documentation", href: "/docs" },
    { label: "API", href: "/api" }
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" }
  ],
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Security", href: "/security" }
  ]
};

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { incrementXP, addBadge } = useGamify();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubscribed(true);
      incrementXP(50);
      addBadge({
        id: "newsletter_subscriber",
        name: "Newsletter Subscriber",
        description: "Subscribed to the Dabao newsletter",
        icon: "📬",
        unlocked: true
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="border-t border-border relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-5 gap-12"
        >
          <motion.div variants={slideUp} className="lg:col-span-2">
            <Link href="/" className="text-2xl font-bold text-gradient mb-4 block">
              Dabao
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Gamified customer engagement platform that helps businesses grow through loyalty and automation.
            </p>
            
            {/* Newsletter subscription */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Stay in the loop</h4>
              {subscribed ? (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary">
                    Thanks for subscribing! Check your inbox for a special welcome gift.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="max-w-xs"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Button type="submit" className="glow-effect">
                    <Mail className="h-4 w-4 mr-2" />
                    Subscribe
                  </Button>
                </form>
              )}
            </div>
            
            <div className="flex gap-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition p-2 rounded-full hover:bg-primary/10">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition p-2 rounded-full hover:bg-primary/10">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition p-2 rounded-full hover:bg-primary/10">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </motion.div>

          <motion.div variants={slideUp}>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={link.href.startsWith('#') ? (e) => {
                      e.preventDefault();
                      scrollToSection(link.href.substring(1));
                    } : undefined}
                    className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={slideUp}>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div variants={slideUp}>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1 group"
                  >
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Dabao. All rights reserved.</p>
          
          <div className="flex items-center mt-4 md:mt-0">
            <button 
              onClick={scrollToTop}
              className="p-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}