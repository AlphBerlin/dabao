import type { Metadata } from 'next'
import '@workspace/ui/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@workspace/auth/contexts/auth-context'

export const metadata: Metadata = {
  title: 'Dabao Studio',
  description: 'Created with Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
