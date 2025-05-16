'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  logoUrl: string;
  primaryColor: string;
}

export function HeroSection({ title, subtitle, logoUrl, primaryColor }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-b from-slate-50 to-slate-100 overflow-hidden py-20">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo */}
          {logoUrl && (
            <div className="mb-8">
              <Image 
                src={logoUrl} 
                alt="Logo" 
                width={120} 
                height={120} 
                className="object-contain"
                style={{
                  maxWidth: "100%",
                  height: "auto"
                }}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-logo.png";
                }}
              />
            </div>
          )}
          
          {/* Title */}
          <h1 
            className="text-4xl md:text-6xl font-extrabold mb-4"
            style={{ color: primaryColor || 'inherit' }}
          >
            {title}
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-slate-600 mb-10">
            {subtitle}
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg" 
              className="text-lg"
              style={{ 
                backgroundColor: primaryColor || undefined,
                borderColor: primaryColor || undefined
              }}
            >
              <Link href="/auth/signup">
                Get Started
              </Link>
            </Button>
            
            <Button 
              asChild
              variant="outline" 
              size="lg" 
              className="text-lg"
              style={{ 
                color: primaryColor || undefined,
                borderColor: primaryColor || undefined
              }}
            >
              <Link href="/auth/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
