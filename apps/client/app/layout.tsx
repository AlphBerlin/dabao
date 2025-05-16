import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { ProjectContextProvider } from "@/hooks/useProjectContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    template: "%s | Loyalty Rewards",
    default: "Loyalty Rewards",
  },
  description: "A multi-tenant loyalty and rewards platform",
};

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
