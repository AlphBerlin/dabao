import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerProjectContext } from "@/lib/server-context";
import { Button } from "@workspace/ui/components/button";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { CTASection } from "@/components/landing/cta-section";
import { db } from "@/lib/db";

export default async function Home() {
  // Get project context on the server
  const projectContext = await getServerProjectContext();
  
  if (!projectContext) {
    return redirect('/domain-error');
  }
  
  // Check if user is authenticated
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // If user is logged in, redirect to app
  if (session?.user) {
    return redirect('/app');
  }
  
  // Get complete project data including brand settings
  const project = await db.project.findUnique({
    where: { id: projectContext.projectId },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      settings: true,
      theme: true,
    }
  });
  
  if (!project) {
    return redirect('/domain-error');
  }
  
  // Extract brand settings and theme
  const brandSettings = project.settings?.brand || {};
  const theme = project.theme || {};
  
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection 
        title={brandSettings.title || project.name || "Welcome"}
        subtitle={brandSettings.subtitle || "Start your journey with us today"}
        logoUrl={project.logo || "/placeholder-logo.png"}
        primaryColor={theme.primaryColor || "#4F46E5"}
      />
      
      <FeaturesSection 
        features={brandSettings.features || [
          { title: "Easy to Use", description: "Simple and intuitive interface", icon: "Zap" },
          { title: "Secure", description: "Your data is always protected", icon: "Shield" },
          { title: "Fast", description: "Optimized for performance", icon: "Rocket" }
        ]}
      />
      
      <CTASection 
        title={brandSettings.ctaTitle || "Ready to get started?"}
        description={brandSettings.ctaDescription || "Create an account and begin your journey"}
        buttonText={brandSettings.ctaButtonText || "Get Started"}
        buttonLink="/auth/signup"
      />
    </div>
  );
}
