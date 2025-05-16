'use client';

import { 
  Zap, Shield, Rocket, BarChart, Heart, Globe,
  Check, Star, Sparkles, Cpu, Cloud, Layers
} from 'lucide-react';

// Map of icon names to Lucide icon components
const iconMap: Record<string, any> = {
  Zap,
  Shield,
  Rocket,
  BarChart,
  Heart,
  Globe,
  Check,
  Star,
  Sparkles,
  Cpu,
  Cloud,
  Layers
};

interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesSectionProps {
  features: Feature[];
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Zap;
            
            return (
              <div 
                key={index} 
                className="p-6 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-300"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
