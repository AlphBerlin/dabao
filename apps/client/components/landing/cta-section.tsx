'use client';

import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';

interface CTASectionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export function CTASection({ title, description, buttonText, buttonLink }: CTASectionProps) {
  return (
    <section className="py-20 bg-indigo-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-8">
            {description}
          </p>
          <Button 
            asChild
            size="lg" 
            variant="secondary" 
            className="text-lg px-8"
          >
            <Link href={buttonLink}>
              {buttonText}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
