import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@workspace/auth/contexts/auth-context'
import { TooltipProvider } from '@workspace/ui/components/tooltip'
import { Providers } from '@/components/providers'
import { OrganizationProviders } from '@/components/organization-providers'
import { PolicyInitializer } from '@/components/policy-initializer'
import '@/app/globals.css'

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
          <TooltipProvider>
            <AuthProvider>
              <OrganizationProviders>
                <Providers>
                  <PolicyInitializer />
                  {children}
                </Providers>
              </OrganizationProviders>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
