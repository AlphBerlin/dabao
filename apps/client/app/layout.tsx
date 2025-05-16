import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { ProjectContextProvider } from "@/hooks/useProjectContext";
import { getServerProjectContext } from "@/lib/server-context";
import { db } from "@/lib/db";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  // Get project context for metadata
  const projectContext = await getServerProjectContext();
  
  if (!projectContext) {
    return {
      title: {
        template: "%s | Customer Portal",
        default: "Customer Portal",
      },
      description: "A multi-tenant customer platform",
    };
  }
  
  // Get project data including brand settings
  const project = await db.project.findUnique({
    where: { id: projectContext.projectId },
    select: {
      name: true,
      settings: true,
    }
  });
  
  // Extract brand settings
  const brandName = project?.name || "Customer Portal";
  const brandSettings = project?.settings?.brand || {};
  
  return {
    title: {
      template: `%s | ${brandName}`,
      default: brandName,
    },
    description: brandSettings.metaDescription || "A multi-tenant customer platform",
    icons: brandSettings.favicon ? { icon: brandSettings.favicon } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider>
          <ProjectContextProvider>
            {children}
          </ProjectContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
