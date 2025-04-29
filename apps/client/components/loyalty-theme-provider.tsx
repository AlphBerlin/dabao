'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export interface LoyaltyThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: string
}

export function LoyaltyThemeProvider({
  children,
  defaultTheme = 'light',
}: LoyaltyThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
      {children}
    </NextThemesProvider>
  )
}