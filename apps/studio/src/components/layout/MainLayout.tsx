"use client"

import type React from "react"

import { Header } from "./Header"
import { ThemeProvider } from "@/components/theme-provider"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </ThemeProvider>
  )
}
